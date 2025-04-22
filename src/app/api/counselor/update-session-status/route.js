import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    // Get the request body
    const { sessionId, status } = await request.json();

    // Validate required fields
    if (!sessionId || !status) {
      return NextResponse.json(
        { success: false, error: 'Session ID and status are required' },
        { status: 400 }
      );
    }

    // Validate status
    const validStatuses = ['scheduled', 'ongoing', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Invalid status. Must be one of: scheduled, ongoing, completed, cancelled' },
        { status: 400 }
      );
    }

    // Initialize Supabase client
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Get the current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Check if the user is a counselor
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', userId)
      .single();

    if (profileError) {
      return NextResponse.json(
        { success: false, error: 'Failed to fetch user profile' },
        { status: 500 }
      );
    }

    if (profile.role !== 'counselor') {
      return NextResponse.json(
        { success: false, error: 'Only counselors can update session status' },
        { status: 403 }
      );
    }

    // Check if the session exists and belongs to this counselor
    const { data: sessionData, error: sessionCheckError } = await supabase
      .from('counseling_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('counselor_id', userId)
      .single();

    if (sessionCheckError) {
      return NextResponse.json(
        { success: false, error: 'Session not found or you do not have permission to update it' },
        { status: 404 }
      );
    }

    // Update the session status
    const { data: updatedSession, error: updateError } = await supabase
      .from('counseling_sessions')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', sessionId)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { success: false, error: 'Failed to update session status: ' + updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      session: updatedSession
    });
  } catch (error) {
    console.error('Error updating session status:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
