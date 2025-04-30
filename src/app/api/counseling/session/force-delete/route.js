import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

// Create a direct Supabase client without session handling
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://euebogudyyeodzkvhyef.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV1ZWJvZ3VkeXllb2R6a3ZoeWVmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDg2Mzk0OCwiZXhwIjoyMDYwNDM5OTQ4fQ.Oi-qM8JYuQIXEf0sMVfQTcwzBBwu3iLLFfVnQNvl8Vc';

// Create a Supabase client with the service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function DELETE(request) {
  try {
    console.log('Force delete API called');
    
    // Get session ID and user ID from query params
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const userId = searchParams.get('userId');
    
    if (!sessionId) {
      return NextResponse.json({
        success: false,
        error: 'Session ID is required'
      }, { status: 400 });
    }
    
    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'User ID is required'
      }, { status: 400 });
    }
    
    console.log(`Force delete request for session ${sessionId} by user ${userId}`);
    
    // First, check if the session exists and the user is the patient
    const { data: session, error: sessionError } = await supabase
      .from('counseling_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();
    
    if (sessionError) {
      console.error('Error fetching session:', sessionError);
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
    console.error('Unexpected error in force delete session API:', error);
    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred',
      details: error.message
    }, { status: 500 });
  }
}
