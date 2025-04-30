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
    "/sessions",
    "/counselor/:path*",
    "/counselor-dashboard"
  ],
};

export async function middleware(request) {
  const res = NextResponse.next();

  // Initialize Supabase client for all routes
  const supabase = createMiddlewareClient({ req: request, res: res });
  const { data: { session } } = await supabase.auth.getSession();

  // Log authentication status for debugging
  console.log('Middleware running for path:', request.nextUrl.pathname);
  console.log('Session exists:', !!session);

  // Handle role-based redirection for the home page
  // Skip redirection if the 'stay' query parameter is present
  if (request.nextUrl.pathname === '/' && request.nextUrl.searchParams.get('stay') !== 'true') {
    // Only redirect if the user is authenticated
    if (session) {
      try {
        console.log('Home page middleware - checking user role for ID:', session.user.id);

        // Get the user's role from their profile
        const { data: profile, error } = await supabase
          .from('user_profiles')
          .select('role, display_name')
          .eq('id', session.user.id)
          .single();

        console.log('Home page middleware - user profile:', profile, error ? `Error: ${error.message}` : 'No error');

        if (!error && profile) {
          // Redirect based on role
          if (profile.role === 'admin') {
            console.log('Redirecting admin user to admin dashboard');
            return NextResponse.redirect(new URL('/admin/dashboard', request.url));
          } else if (profile.role === 'counselor') {
            console.log('Redirecting counselor user to counselor dashboard');
            return NextResponse.redirect(new URL('/counselor-dashboard', request.url));
          } else if (profile.role === 'user') {
            console.log('Redirecting regular user to home page');
            return NextResponse.redirect(new URL('/home', request.url));
          } else {
            console.log('Redirecting user with unknown role to home page, role:', profile.role);
            return NextResponse.redirect(new URL('/home', request.url));
          }
        } else {
          console.log('No profile found or error occurred, redirecting to home page');
          return NextResponse.redirect(new URL('/home', request.url));
        }
      } catch (error) {
        console.error('Error in role-based redirection:', error);
        // Continue to home page if there's an error
        console.log('Error occurred, redirecting to home page');
        return NextResponse.redirect(new URL('/home', request.url));
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

  // Handle authentication for counselor dashboard
  if (request.nextUrl.pathname.startsWith('/counselor') || request.nextUrl.pathname.startsWith('/counselor-dashboard')) {
    console.log('Middleware handling counselor path:', request.nextUrl.pathname);

    if (!session) {
      console.log('No session found for counselor area, redirecting to login');
      const redirectUrl = new URL('/account/signin', request.url);
      redirectUrl.searchParams.set('redirect', '/counselor-dashboard');
      return NextResponse.redirect(redirectUrl);
    } else {
      console.log('Session found for counselor area, user ID:', session.user.id, 'Email:', session.user.email);

      // Check if the user is a counselor
      try {
        console.log('Checking if user is a counselor...');
        const { data: profile, error } = await supabase
          .from('user_profiles')
          .select('role, display_name')
          .eq('id', session.user.id)
          .single();

        console.log('Counselor middleware - user profile:', profile, error ? `Error: ${error.message}` : 'No error');

        if (error) {
          console.error('Error fetching user profile:', error);
          // Continue anyway, the page component will handle this
        } else if (!profile) {
          console.log('No profile found for user, creating redirect to home');
          return NextResponse.redirect(new URL('/home', request.url));
        } else if (profile.role !== 'counselor') {
          console.log('User role is not counselor, it is:', profile.role);
          console.log('Creating redirect to home page');
          return NextResponse.redirect(new URL('/home', request.url));
        } else {
          console.log('User is confirmed as a counselor, allowing access to counselor area');
        }
      } catch (error) {
        console.error('Error checking counselor role:', error);
      }
    }
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
