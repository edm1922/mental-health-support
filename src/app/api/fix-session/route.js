import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    // Get the session ID from the query parameters
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('id');
    
    if (!sessionId) {
      return NextResponse.json({
        success: false,
        error: 'Session ID is required'
      }, { status: 400 });
    }
    
    // Initialize Supabase client with cookies
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    console.log('Fixing session with ID:', sessionId);
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('Error getting user:', userError);
      return NextResponse.json({
        success: false,
        error: 'Authentication error: ' + userError.message
      }, { status: 401 });
    }
    
    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'User not authenticated'
      }, { status: 401 });
    }
    
    // Check if the session exists
    const { data: sessionData, error: sessionError } = await supabase
      .from('counseling_sessions')
      .select('*')
      .eq('id', sessionId);
    
    if (sessionError) {
      console.error('Error checking session:', sessionError);
      return NextResponse.json({
        success: false,
        error: 'Error checking session: ' + sessionError.message
      });
    }
    
    // If session doesn't exist, create it
    if (!sessionData || sessionData.length === 0) {
      console.log('Session not found, creating new session with ID:', sessionId);
      
      // Create a new session with the provided ID
      const { data: newSession, error: createError } = await supabase
        .from('counseling_sessions')
        .insert({
          id: sessionId,
          counselor_id: user.id,
          patient_id: user.id, // For testing, use the same user as both counselor and patient
          session_date: new Date().toISOString(),
          status: 'scheduled'
        })
        .select();
      
      if (createError) {
        console.error('Error creating session:', createError);
        return NextResponse.json({
          success: false,
          error: 'Error creating session: ' + createError.message
        });
      }
      
      return NextResponse.json({
        success: true,
        message: 'Session created successfully',
        session: newSession[0]
      });
    }
    
    // Session exists, check if it has counselor_id and patient_id
    const session = sessionData[0];
    const updates = {};
    
    if (!session.counselor_id) {
      updates.counselor_id = user.id;
    }
    
    if (!session.patient_id) {
      updates.patient_id = user.id;
    }
    
    // If updates are needed, update the session
    if (Object.keys(updates).length > 0) {
      console.log('Updating session with:', updates);
      
      const { data: updatedSession, error: updateError } = await supabase
        .from('counseling_sessions')
        .update(updates)
        .eq('id', sessionId)
        .select();
      
      if (updateError) {
        console.error('Error updating session:', updateError);
        return NextResponse.json({
          success: false,
          error: 'Error updating session: ' + updateError.message
        });
      }
      
      return NextResponse.json({
        success: true,
        message: 'Session updated successfully',
        session: updatedSession[0]
      });
    }
    
    // Session exists and has all required fields
    return NextResponse.json({
      success: true,
      message: 'Session is valid',
      session: session
    });
  } catch (error) {
    console.error('Error in fix-session API:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
