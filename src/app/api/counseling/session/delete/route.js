import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function DELETE(request) {
  try {
    // Initialize Supabase client
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Get the current user - try multiple approaches
    let userId = null;
    let authError = null;

    // Approach 1: Get user from auth.getUser()
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (!userError && user) {
        console.log('Delete session API - Auth user from getUser:', user.id);
        userId = user.id;
      } else if (userError) {
        console.error('Auth error from getUser:', userError);
        authError = userError;
      }
    } catch (error) {
      console.error('Exception in getUser:', error);
    }

    // Approach 2: Get user from auth.getSession()
    if (!userId) {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (!sessionError && session?.user) {
          console.log('Delete session API - Auth user from getSession:', session.user.id);
          userId = session.user.id;
        } else if (sessionError) {
          console.error('Session error:', sessionError);
          if (!authError) authError = sessionError;
        }
      } catch (error) {
        console.error('Exception in getSession:', error);
      }
    }

    // Approach 3: Get user from RPC function
    if (!userId) {
      try {
        const { data: userData, error: rpcError } = await supabase.rpc('get_current_user');
        console.log('RPC get_current_user result:', userData);

        if (!rpcError && userData && userData.authenticated) {
          console.log('Using RPC user ID:', userData.user.id);
          userId = userData.user.id;
        } else if (rpcError) {
          console.error('RPC error:', rpcError);
          if (!authError) authError = rpcError;
        }
      } catch (error) {
        console.error('Exception in get_current_user RPC:', error);
      }
    }

    // Approach 4: Direct SQL query for auth.uid()
    if (!userId) {
      try {
        const { data, error } = await supabase.rpc('exec_sql', {
          sql: 'SELECT auth.uid() as uid;'
        });

        if (!error && data && data[0]?.uid) {
          console.log('Using direct SQL auth.uid():', data[0].uid);
          userId = data[0].uid;
        } else if (error) {
          console.error('SQL error:', error);
          if (!authError) authError = error;
        }
      } catch (error) {
        console.error('Exception in direct SQL query:', error);
      }
    }

    // If we still don't have a user ID, return an error
    if (!userId) {
      console.log('No authenticated user found after trying all approaches');
      return NextResponse.json({
        success: false,
        error: 'Authentication required: ' + (authError ? authError.message : 'No user ID found')
      }, { status: 401 });
    }

    // Get session ID from query params
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json({
        success: false,
        error: 'Session ID is required'
      }, { status: 400 });
    }

    // First, check if the user is authorized to delete this session
    // Only the patient who booked the session can delete it
    const { data: session, error: sessionError } = await supabase
      .from('counseling_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (sessionError) {
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch session details',
        details: sessionError.message
      }, { status: 500 });
    }

    if (!session) {
      return NextResponse.json({
        success: false,
        error: 'Session not found'
      }, { status: 404 });
    }

    // Check if the user is the patient of this session
    // Convert UUIDs to strings for comparison to avoid type mismatch issues
    if (session.patient_id.toString() !== userId.toString()) {
      console.log('Authorization failed: User ID:', userId, 'Patient ID:', session.patient_id);
      return NextResponse.json({
        success: false,
        error: 'Only the patient who booked the session can delete it'
      }, { status: 403 });
    }

    // Check if the session is in the future or past
    const sessionDate = new Date(session.scheduled_for || session.session_date);
    const now = new Date();

    // For past sessions, we'll just delete the messages but keep the session record
    // For future sessions, we'll delete both messages and the session
    const isPastSession = sessionDate < now;

    // Delete related messages first
    const { error: messagesError } = await supabase
      .from('session_messages')
      .delete()
      .eq('session_id', sessionId);

    if (messagesError) {
      console.error('Error deleting session messages:', messagesError);
      // Continue with session deletion even if message deletion fails
    }

    // For future sessions, delete the session
    // For past sessions, just mark it as deleted but keep the record
    let deleteError;

    if (isPastSession) {
      // For past sessions, just update the status to 'deleted'
      const { error } = await supabase
        .from('counseling_sessions')
        .update({ status: 'deleted' })
        .eq('id', sessionId);

      deleteError = error;
    } else {
      // For future sessions, delete the session completely
      const { error } = await supabase
        .from('counseling_sessions')
        .delete()
        .eq('id', sessionId);

      deleteError = error;
    }

    if (deleteError) {
      return NextResponse.json({
        success: false,
        error: 'Failed to delete session',
        details: deleteError.message
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Session deleted successfully'
    });
  } catch (error) {
    console.error('Unexpected error in delete session API:', error);
    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred',
      details: error.message
    }, { status: 500 });
  }
}
