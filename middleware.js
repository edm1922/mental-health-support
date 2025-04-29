import { NextResponse } from 'next/server';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';

export async function middleware(req) {
  // Create a response object
  const res = NextResponse.next();

  // Create a Supabase client configured to use cookies
  const supabase = createMiddlewareClient({ req, res });

  try {
    // Refresh session if expired - required for Server Components
    const { data } = await supabase.auth.getSession();

    // Check if the request is for a protected page
    if (['/messages', '/counseling', '/admin'].some(path => req.nextUrl.pathname.startsWith(path))) {
      // If no session, redirect to login
      if (!data?.session) {
        console.log('No session found, redirecting to login');
        const redirectUrl = new URL('/account/signin', req.url);
        redirectUrl.searchParams.set('redirect', req.nextUrl.pathname);
        return NextResponse.redirect(redirectUrl);
      }
    }

    // Session exists, continue
    return res;
  } catch (error) {
    console.error('Middleware auth error:', error);

    // On error, allow the request to continue
    // The API routes will handle authentication errors
    return res;
  }
}

// Only run middleware on specific paths
export const config = {
  matcher: [
    '/messages',
    '/messages/:path*',
    '/counseling/:path*',
    '/admin/:path*'
  ],
};
