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
  const res = NextResponse.next();

  // Initialize Supabase client for all routes
  const supabase = createMiddlewareClient({ req: request, res: res });

  // Try to get the session
  let sessionData = await supabase.auth.getSession();
  let session = sessionData.data.session;

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

  // Handle sign-in page - let the client-side handle authentication
  if (request.nextUrl.pathname === '/account/signin') {
    // Always let the client handle the sign-in page
    // This prevents middleware from interfering with the client-side authentication flow
    return res;
  }

  return res;
}
