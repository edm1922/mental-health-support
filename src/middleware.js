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
    "/counselor-dashboard",
    "/account/signin",
    "/account/signin/:path*"
  ],
};

export async function middleware(request) {
  // Log the request URL and environment for debugging
  console.log(`Middleware: Processing ${request.nextUrl.pathname} (${process.env.NODE_ENV})`);
  console.log(`Middleware: Query params: ${request.nextUrl.search}`);

  const res = NextResponse.next();

  // Initialize Supabase client for all routes
  const supabase = createMiddlewareClient({ req: request, res: res });

  // Try to get the session
  let sessionData = await supabase.auth.getSession();
  let session = sessionData.data.session;

  // Log session status
  console.log(`Middleware: Session exists: ${!!session}`);
  if (session) {
    console.log(`Middleware: User ID: ${session.user.id}`);
  }

  // Always try to refresh the session to ensure it's up-to-date
  try {
    await supabase.auth.refreshSession();
    const refreshResult = await supabase.auth.getSession();
    const refreshedSession = refreshResult.data.session;

    // If we now have a session, update our local variable
    if (refreshedSession) {
      session = refreshedSession;
    }
  } catch (refreshError) {
    console.error('Error refreshing session in middleware:', refreshError);
  }

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
            return NextResponse.redirect(new URL('/admin/dashboard', request.url));
          } else if (profile.role === 'counselor') {
            return NextResponse.redirect(new URL('/counselor/dashboard/direct', request.url));
          } else {
            // Default for regular users or unknown roles
            return NextResponse.redirect(new URL('/home', request.url));
          }
        } else {
          return NextResponse.redirect(new URL('/home', request.url));
        }
      } catch (error) {
        console.error('Error in role-based redirection:', error);
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
    // Check if the no_redirect flag is set - this is more reliable than checking the Referer header
    if (request.nextUrl.searchParams.get('no_redirect') === 'true') {
      console.log('Middleware: no_redirect parameter detected, allowing access to counselor dashboard');
      return res;
    }

    // Special case for /counselor/dashboard/direct - this is the endpoint that's causing the loop
    if (request.nextUrl.pathname === '/counselor/dashboard/direct') {
      console.log('Middleware: Handling direct counselor dashboard access');

      // Check if the user is authenticated
      if (!session) {
        console.log('Middleware: No session for counselor dashboard, redirecting to signin');
        // Use a different parameter to avoid redirect loops
        const redirectUrl = new URL('/account/signin', request.url);
        redirectUrl.searchParams.set('redirect', request.nextUrl.pathname);
        return NextResponse.redirect(redirectUrl);
      }

      // If authenticated, allow access and let the page component handle authorization
      return res;
    }

    // Redirect from old counselor-dashboard to new counselor/dashboard
    if (request.nextUrl.pathname === '/counselor-dashboard') {
      return NextResponse.redirect(new URL('/counselor/dashboard/direct', request.url));
    }

    // Check if the user is authenticated
    if (!session) {
      const redirectUrl = new URL('/account/signin', request.url);
      redirectUrl.searchParams.set('redirect', request.nextUrl.pathname);
      return NextResponse.redirect(redirectUrl);
    }

    // Check user_metadata for role (faster and more reliable)
    const userMetadataRole = session.user.user_metadata?.role;
    if (userMetadataRole === 'counselor') {
      return res;
    }

    // Check if the user is a counselor
    try {
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

      // If there's an error or no profile, redirect to home
      if (error || !profile) {
        return NextResponse.redirect(new URL('/home', request.url));
      }

      if (profile.role !== 'counselor') {
        return NextResponse.redirect(new URL('/home', request.url));
      }

      // If we get here, the user is a counselor, so allow access
      return res;
    } catch (error) {
      console.error('Error in counselor role check:', error);
      // On error, redirect to sign-in page
      const redirectUrl = new URL('/account/signin', request.url);
      redirectUrl.searchParams.set('redirect', request.nextUrl.pathname);
      return NextResponse.redirect(redirectUrl);
    }
  }

  // Handle admin routes
  if (request.nextUrl.pathname.startsWith('/admin')) {
    // Check if the no_redirect flag is set - this is more reliable than checking the Referer header
    if (request.nextUrl.searchParams.get('no_redirect') === 'true') {
      console.log('Middleware: no_redirect parameter detected, allowing access to admin dashboard');
      return res;
    }

    try {
      // Check if the user is authenticated
      if (!session) {
        const redirectUrl = new URL('/account/signin', request.url);
        redirectUrl.searchParams.set('redirect', '/admin/dashboard');
        return NextResponse.redirect(redirectUrl);
      }

      // Check if the user is an admin
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (error || !profile) {
        return NextResponse.redirect(new URL('/home', request.url));
      }

      if (profile.role !== 'admin') {
        return NextResponse.redirect(new URL('/home', request.url));
      }

      // If we get here, the user is an admin, so allow access
      return res;
    } catch (error) {
      console.error('Error in admin middleware:', error);
      // On error, redirect to home to be safe
      return NextResponse.redirect(new URL('/home', request.url));
    }
  }

  // Handle sign-in page - redirect authenticated users based on role
  if (request.nextUrl.pathname === '/account/signin') {
    // Check if we have a special redirect parameter - if so, don't redirect
    if (request.nextUrl.searchParams.get('counselor_redirect') === 'true' ||
        request.nextUrl.searchParams.get('admin_redirect') === 'true' ||
        request.nextUrl.searchParams.get('no_auto_redirect') === 'true') {
      console.log('Middleware: Special redirect parameter detected, allowing access to signin page');
      return res;
    }

    // If the user is already authenticated, redirect them based on role
    if (session) {
      try {
        // Get the user's role from their profile
        const { data: profile, error } = await supabase
          .from('user_profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();

        console.log('Middleware: Authenticated user on sign-in page, role:', profile?.role);

        // Redirect based on role
        if (!error && profile) {
          if (profile.role === 'counselor') {
            console.log('Middleware: Redirecting counselor to dashboard');
            return NextResponse.redirect(new URL('/counselor/dashboard/direct?no_redirect=true', request.url));
          } else if (profile.role === 'admin') {
            console.log('Middleware: Redirecting admin to dashboard');
            return NextResponse.redirect(new URL('/admin/dashboard?no_redirect=true', request.url));
          } else {
            console.log('Middleware: Redirecting regular user to home');
            return NextResponse.redirect(new URL('/home', request.url));
          }
        } else {
          // Default redirect if we can't determine the role
          console.log('Middleware: Unable to determine role, redirecting to home');
          return NextResponse.redirect(new URL('/home', request.url));
        }
      } catch (error) {
        console.error('Middleware: Error checking role:', error);
        // On error, redirect to home to be safe
        return NextResponse.redirect(new URL('/home', request.url));
      }
    }

    // For unauthenticated users, let them access the sign-in page
    return res;
  }

  return res;
}
