import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic'; // This ensures the route is always dynamic

export async function POST() {
  try {
    // Initialize Supabase client
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get the current session
    const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Error getting session:', sessionError);
      return NextResponse.json(
        { error: 'Failed to get session' },
        { status: 500 }
      );
    }
    
    if (!currentSession) {
      return NextResponse.json(
        { error: 'No active session found' },
        { status: 401 }
      );
    }
    
    // Refresh the session
    const { data, error } = await supabase.auth.refreshSession();
    
    if (error) {
      console.error('Error refreshing session:', error);
      return NextResponse.json(
        { error: 'Failed to refresh session' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      session: {
        user: data.session.user,
        expires_at: data.session.expires_at
      }
    });
  } catch (error) {
    console.error('Unexpected error in refresh-session API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
