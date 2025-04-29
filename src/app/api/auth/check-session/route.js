import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic'; // This ensures the route is always dynamic

export async function GET() {
  try {
    // Initialize Supabase client
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get the session
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Error getting session:', error);
      return NextResponse.json(
        { error: `Error getting session: ${error.message}` },
        { status: 500 }
      );
    }
    
    if (!session) {
      return NextResponse.json({
        authenticated: false,
        message: 'No session found'
      });
    }
    
    // Return session info (excluding sensitive data)
    return NextResponse.json({
      authenticated: true,
      user: {
        id: session.user.id,
        email: session.user.email,
        role: session.user.role
      },
      session_expires_at: session.expires_at
    });
  } catch (error) {
    console.error('Unexpected error in check-session API:', error);
    return NextResponse.json(
      { error: `Internal server error: ${error.message}` },
      { status: 500 }
    );
  }
}
