import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic'; // This ensures the route is always dynamic

export async function POST(request) {
  try {
    // Initialize Supabase client
    const supabase = createRouteHandlerClient({ cookies });

    // Get the current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      console.error('Error getting session:', sessionError);
      return NextResponse.json(
        { error: 'Failed to get session', authenticated: false },
        { status: 500 }
      );
    }

    if (!session) {
      return NextResponse.json(
        { authenticated: false, message: 'No active session found' }
      );
    }

    // Try to refresh the session
    try {
      const { data, error } = await supabase.auth.refreshSession();

      if (error) {
        console.error('Error refreshing session:', error);
        // Continue with the current session
      } else if (data && data.session) {
        // Use the refreshed session
        console.log('Session refreshed successfully');
        // Note: We don't reassign session as it would cause an error
        // Just use the current session
      }
    } catch (refreshError) {
      console.error('Exception refreshing session:', refreshError);
      // Continue with the current session
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: session.user.id,
        email: session.user.email
      }
    });
  } catch (error) {
    console.error('Unexpected error in community-auth API:', error);
    return NextResponse.json(
      { error: 'Internal server error', authenticated: false },
      { status: 500 }
    );
  }
}
