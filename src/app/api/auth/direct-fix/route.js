import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    // Get request body
    const { userId, accessToken, refreshToken } = await request.json();
    
    if (!userId || !accessToken) {
      return NextResponse.json({ 
        success: false, 
        error: 'User ID and access token are required' 
      }, { status: 400 });
    }
    
    // Initialize Supabase client
    const cookieStore = cookies();
    
    // Set the cookies directly
    cookieStore.set('sb-access-token', accessToken, {
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      sameSite: 'lax'
    });
    
    if (refreshToken) {
      cookieStore.set('sb-refresh-token', refreshToken, {
        path: '/',
        maxAge: 60 * 60 * 24 * 30, // 30 days
        sameSite: 'lax'
      });
    }
    
    // Also set the Supabase-specific cookies
    cookieStore.set(`sb-euebogudyyeodzkvhyef-auth-token`, accessToken, {
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      sameSite: 'lax'
    });
    
    if (refreshToken) {
      cookieStore.set(`sb-euebogudyyeodzkvhyef-auth-token-refresh`, refreshToken, {
        path: '/',
        maxAge: 60 * 60 * 24 * 30, // 30 days
        sameSite: 'lax'
      });
    }
    
    // Initialize Supabase client with the updated cookies
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Verify the session was set correctly
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to set session: ' + (sessionError?.message || 'No session created')
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Authentication fixed successfully',
      session: {
        userId: session.user.id,
        expiresAt: new Date(session.expires_at * 1000).toISOString()
      }
    });
  } catch (error) {
    console.error('Unexpected error in direct-fix:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'An unexpected error occurred: ' + error.message
    }, { status: 500 });
  }
}
