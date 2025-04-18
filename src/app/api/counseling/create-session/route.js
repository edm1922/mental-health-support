import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request) {
  try {
    // Get the request body
    const {
      counselorId,
      patientId,
      type,
      scheduledFor,
      videoEnabled = false,
      notes = null
    } = await request.json();

    // Validate required fields
    if (!counselorId || !patientId || !type || !scheduledFor) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate session type
    const validTypes = ['one_on_one', 'group'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: 'Invalid session type. Must be "one_on_one" or "group"' },
        { status: 400 }
      );
    }

    // Validate date format
    const scheduledDate = new Date(scheduledFor);
    if (isNaN(scheduledDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format for scheduledFor' },
        { status: 400 }
      );
    }

    // Initialize Supabase client
    const supabase = createRouteHandlerClient({ cookies });

    // Verify the user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Insert the session into the database
    const { data: newSession, error: insertError } = await supabase
      .from('counseling_sessions')
      .insert({
        counselor_id: counselorId,
        patient_id: patientId,
        type: type,
        status: 'scheduled',
        session_date: scheduledDate,
        duration: 60, // Default to 60 minutes
        notes: notes,
        video_enabled: videoEnabled
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating session:', insertError);
      return NextResponse.json(
        { error: 'Failed to create counseling session: ' + insertError.message },
        { status: 500 }
      );
    }

    // If video is enabled, we'll create a placeholder for the video room
    // The actual room will be created when the user accesses the session
    if (videoEnabled) {
      console.log('Video enabled for session:', newSession.id);
    }

    return NextResponse.json({
      success: true,
      session: {
        id: newSession.id,
        counselorId: newSession.counselor_id,
        clientId: newSession.patient_id,
        type: newSession.type,
        status: newSession.status,
        sessionDate: newSession.session_date,
        duration: newSession.duration,
        notes: newSession.notes,
        videoEnabled: newSession.video_enabled,
        createdAt: newSession.created_at
      }
    });
  } catch (error) {
    console.error('Error creating counseling session:', error);
    return NextResponse.json(
      { error: 'Failed to create counseling session: ' + error.message },
      { status: 500 }
    );
  }
}
