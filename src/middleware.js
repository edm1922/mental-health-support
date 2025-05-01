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
    // Temporarily comment out counselor routes to bypass middleware
    // "/counselor/:path*",
    // "/counselor-dashboard",
    "/account/signin",
    "/account/signin/:path*"
  ],
};

export async function middleware(request) {
  const res = NextResponse.next();

  // Initialize Supabase client for all routes
  const supabase = createMiddlewareClient({ req: request, res: res });

  // Try to get the session
  let sessionData = await supabase.auth.getSession();
  let session = sessionData.data.session;

  // Log authentication status for debugging
  console.log('Middleware running for path:', request.nextUrl.pathname);
  console.log('Session exists:', !!session);



  // Always try to refresh the session to ensure it's up-to-date
  try {
    console.log('Attempting to refresh session in middleware');
    // Try to refresh the session
    await supabase.auth.refreshSession();

    // Get the session again after refresh
    const refreshResult = await supabase.auth.getSession();
    const refreshedSession = refreshResult.data.session;

    console.log('Session after refresh attempt:', !!refreshedSession);

    // If we now have a session, update our local variable
    if (refreshedSession) {
      session = refreshedSession;
      console.log('Session updated after refresh');
    }
  } catch (refreshError) {
    console.error('Error refreshing session in middleware:', refreshError);
  }

  // Debug: Check cookies
  const allCookies = request.cookies.getAll();
  console.log('Cookies:', allCookies.map(c => c.name).join(', '));

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
            console.log('Redirecting counselor user to green counselor dashboard');
            return NextResponse.redirect(new URL('/counselor/dashboard/direct', request.url));
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



    // Redirect from old counselor-dashboard to new counselor/dashboard
    if (request.nextUrl.pathname === '/counselor-dashboard') {
      console.log('Redirecting from old counselor-dashboard to new counselor/dashboard path');
      return NextResponse.redirect(new URL('/counselor/dashboard', request.url));
    }

    // Check if the user is authenticated
    if (!session) {
      console.log('No session found for counselor area, redirecting to login');
      const redirectUrl = new URL('/account/signin', request.url);
      redirectUrl.searchParams.set('redirect', request.nextUrl.pathname);
      return NextResponse.redirect(redirectUrl);
    }

    console.log('Session found for counselor area, user ID:', session.user.id);



    // Check user_metadata for role (faster and more reliable)
    const userMetadataRole = session.user.user_metadata?.role;
    console.log('Role from user_metadata:', userMetadataRole);

    if (userMetadataRole === 'counselor') {
      console.log('User is a counselor (from metadata), allowing access');
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
        console.log('Profile error or not found, redirecting to home');
        return NextResponse.redirect(new URL('/home', request.url));
      }

      console.log('User role for counselor area:', profile.role);

      if (profile.role !== 'counselor') {
        console.log('User is not a counselor, redirecting to home');
        return NextResponse.redirect(new URL('/home', request.url));
      }

      console.log('User is a counselor, allowing access to:', request.nextUrl.pathname);

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
    console.log('Middleware handling admin path:', request.nextUrl.pathname);

    try {
      // We already initialized the Supabase client and got the session above
      if (!session) {
        console.log('No session found for admin area, redirecting to login');
        const redirectUrl = new URL('/account/signin', request.url);
        redirectUrl.searchParams.set('redirect', '/admin/dashboard');
        return NextResponse.redirect(redirectUrl);
      }

      console.log('Session found for admin area, user ID:', session.user.id);

      // Check if the user is an admin
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (error) {
        console.error('Error fetching user profile in admin middleware:', error);
        // If we can't verify the role, redirect to home to be safe
        console.log('Could not verify admin role, redirecting to home');
        return NextResponse.redirect(new URL('/home', request.url));
      }

      if (!profile) {
        console.log('No profile found for user in admin middleware, redirecting to home');
        return NextResponse.redirect(new URL('/home', request.url));
      }

      console.log('User role for admin area:', profile.role);

      if (profile.role !== 'admin') {
        console.log('User is not an admin, redirecting to home');
        return NextResponse.redirect(new URL('/home', request.url));
      }

      console.log('User is an admin, allowing access to:', request.nextUrl.pathname);

      // If we get here, the user is an admin, so allow access
      return res;
    } catch (error) {
      console.error('Error in admin middleware:', error);
      // On error, redirect to home to be safe
      return NextResponse.redirect(new URL('/home', request.url));
    }
  }



  // Handle sign-in page - let the client-side handle authentication
  if (request.nextUrl.pathname === '/account/signin') {
    console.log('Sign-in page accessed, letting client-side handle authentication');

    // Always let the client handle the sign-in page
    // This prevents middleware from interfering with the client-side authentication flow
    return res;
  }

  return res;
}
