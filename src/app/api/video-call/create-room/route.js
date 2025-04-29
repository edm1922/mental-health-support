import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request) {
  try {
    // Get the request body
    const { sessionId, expiryMinutes = 60 } = await request.json();

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
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

    // Verify the user has access to this session
    const { data: counselingSession, error: sessionError } = await supabase
      .from('counseling_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (sessionError) {
      console.error('Error fetching session:', sessionError);
      return NextResponse.json(
        { error: 'Failed to fetch session details' },
        { status: 500 }
      );
    }

    // Check if user is either the counselor or client for this session
    const userId = session.user.id;
    if (counselingSession.counselor_id !== userId && counselingSession.patient_id !== userId) {
      return NextResponse.json(
        { error: 'You do not have permission to access this session' },
        { status: 403 }
      );
    }

    // Check if a room already exists for this session
    if (counselingSession.video_room_id && counselingSession.video_join_url) {
      return NextResponse.json({
        success: true,
        roomUrl: counselingSession.video_join_url,
        roomId: counselingSession.video_room_id,
        message: 'Video room already exists'
      });
    }

    // Calculate expiry (e.g., 60 minutes from now)
    const exp = Math.floor(Date.now() / 1000) + expiryMinutes * 60;

    // Generate a unique room name
    const roomName = `session-${sessionId}-${Date.now()}`;

    // In a production environment, you would call the Daily.co API here
    // For development/demo purposes, we'll create a mock room URL

    // This is a placeholder - in production, you would call the Daily.co API
    // const response = await fetch('https://api.daily.co/v1/rooms', {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'Authorization': `Bearer ${process.env.DAILY_API_KEY}`
    //   },
    //   body: JSON.stringify({
    //     name: roomName,
    //     properties: {
    //       exp,
    //       enable_chat: true,
    //       enable_screenshare: true,
    //       start_video_off: false,
    //       start_audio_off: false
    //     }
    //   })
    // });

    // For demo purposes, create a mock room URL
    // In production, you would use the response from the Daily.co API
    const mockRoomData = {
      name: roomName,
      url: `https://yourdomain.daily.co/${roomName}`,
      // In production, this would come from the Daily.co API response
    };

    // Update the counseling session with the room URL
    // Adapting to the unusual table structure
    const { error: updateError } = await supabase
      .from('counseling_sessions')
      .update({
        video_enabled: true,
        video_room_id: mockRoomData.name,
        video_join_url: mockRoomData.url
      })
      .eq('id', sessionId);

    if (updateError) {
      console.error('Error updating session:', updateError);
      return NextResponse.json(
        { error: 'Failed to update session with video details' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      roomUrl: mockRoomData.url,
      roomId: mockRoomData.name,
      expiresAt: new Date((exp) * 1000).toISOString()
    });
  } catch (error) {
    console.error('Error creating video room:', error);
    return NextResponse.json(
      { error: 'Failed to create video room: ' + error.message },
      { status: 500 }
    );
  }
}
