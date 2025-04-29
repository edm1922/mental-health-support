import { NextResponse } from "next/server";
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';

export const config = {
  matcher: [
    "/integrations/:path*",
    "/apply/counselor",
    "/admin/:path*",
    "/",
    "/profile",
    "/counselor/profile/:id*",
    "/counselor-profile/:id*",
    "/sessions"
  ],
};

export async function middleware(request) {
  const res = NextResponse.next();

  // Initialize Supabase client for all routes
  const supabase = createMiddlewareClient({ req: request, res: res });
  const { data: { session } } = await supabase.auth.getSession();

  // Handle role-based redirection for the home page
  // Skip redirection if the 'stay' query parameter is present
  if (request.nextUrl.pathname === '/' && request.nextUrl.searchParams.get('stay') !== 'true') {
    // Only redirect if the user is authenticated
    if (session) {
      try {
        // Get the user's role from their profile
        const { data: profile, error } = await supabase
          .from('user_profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();

        if (!error && profile) {
          // Redirect based on role
          if (profile.role === 'admin') {
            console.log('Redirecting admin user to admin dashboard');
            return NextResponse.redirect(new URL('/admin/dashboard', request.url));
          } else if (profile.role === 'counselor') {
            console.log('Redirecting counselor user to counselor dashboard');
            return NextResponse.redirect(new URL('/counselor/dashboard', request.url));
          } else if (profile.role === 'user') {
            console.log('Redirecting regular user to home page');
            return NextResponse.redirect(new URL('/home', request.url));
          } else {
            console.log('Redirecting user with unknown role to home page');
            return NextResponse.redirect(new URL('/home', request.url));
          }
        }
      } catch (error) {
        console.error('Error in role-based redirection:', error);
        // Continue to home page if there's an error
      }
    }
  }

  // Redirect /apply/counselor to /counselor/apply
  if (request.nextUrl.pathname === '/apply/counselor') {
    return NextResponse.redirect(new URL('/counselor/apply', request.url));
  }

  // Handle counselor profile URLs - support both paths
  if (request.nextUrl.pathname.startsWith('/counselor/profile/')) {
    try {
      // Get the counselor ID from the URL
      const id = request.nextUrl.pathname.split('/').pop();

      // Redirect to the new path format
      console.log(`Redirecting from /counselor/profile/${id} to /counselor-profile/${id}`);
      return NextResponse.redirect(new URL(`/counselor-profile/${id}`, request.url));
    } catch (error) {
      console.error('Error in counselor profile middleware:', error);
      // On error, continue with the original request
    }
  }

  // Redirect from profile page to home page
  if (request.nextUrl.pathname === '/profile') {
    console.log('Redirecting from profile page to home page');
    return NextResponse.redirect(new URL('/home', request.url));
  }

  // Handle integrations
  if (request.nextUrl.pathname.startsWith('/integrations')) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-createxyz-project-id", "27ed0ec4-e14d-4812-b215-5d986c30f01d");

    request.nextUrl.href = `https://www.create.xyz/${request.nextUrl.pathname}`;

    return NextResponse.rewrite(request.nextUrl, {
      request: {
        headers: requestHeaders,
      },
    });
  }

  // Check for database issues on admin routes
  if (request.nextUrl.pathname.startsWith('/admin')) {
    try {
      // We already initialized the Supabase client and got the session above
      if (session) {
        // Check if the user is an admin
        const { data: profile, error } = await supabase
          .from('user_profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();

        if (!error && profile?.role === 'admin') {
          // Check if we need to fix database issues
          // We'll do this by checking if the exec_sql function exists
          try {
            const { error: execSqlError } = await supabase.rpc('exec_sql', {
              sql: 'SELECT 1 as test;'
            });

            if (execSqlError) {
              // There's an issue with the exec_sql function
              // We'll redirect to the database management page with auto_fix parameter
              console.log('Database issue detected in middleware, redirecting to database management');

              // Only redirect if we're not already on the database management page
              // and not already calling the auto-fix endpoint
              if (!request.nextUrl.pathname.includes('/database-management') &&
                  !request.nextUrl.pathname.includes('/api/system/auto-fix-database')) {
                // Add a query parameter to indicate we're coming from middleware
                const url = new URL('/admin/database-management', request.url);
                url.searchParams.set('auto_fix', 'true');
                return NextResponse.redirect(url);
              }
            }
          } catch (error) {
            console.error('Error checking database in middleware:', error);
          }
        }
      }
    } catch (error) {
      console.error('Error in database check middleware:', error);
    }
  }

  return res;
}
