import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

// Create a direct Supabase client with admin privileges
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://euebogudyyeodzkvhyef.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV1ZWJvZ3VkeXllb2R6a3ZoeWVmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcwMDAwMDAwMCwiZXhwIjoyMDAwMDAwMDAwfQ.Oi-qM8JYuQIXEf0sMVfQTcwzBBwu3iLLFfVnQNvl8Vc';

export async function DELETE(request) {
  try {
    // Get session ID from query params
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    
    if (!sessionId) {
      return NextResponse.json({
        success: false,
        error: 'Session ID is required'
      }, { status: 400 });
    }
    
    console.log(`DB-delete request for session ${sessionId}`);
    
    // Create a fresh Supabase client for each request
    const adminSupabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // First, check if the session exists
    const { data: sessionData, error: checkError } = await adminSupabase
      .from('counseling_sessions')
      .select('id')
      .eq('id', sessionId)
      .single();
      
    if (checkError) {
      console.log('Error checking session:', checkError);
      // If the error is not found, we can consider it already deleted
      if (checkError.code === 'PGRST116') {
        return NextResponse.json({
          success: true,
          message: 'Session already deleted or does not exist'
        });
      }
      
      return NextResponse.json({
        success: false,
        error: 'Error checking session',
        details: checkError.message
      }, { status: 500 });
    }
    
    console.log('Session exists:', sessionData);
    
    // Try to delete any related messages first
    try {
      const { error: messagesError } = await adminSupabase
        .from('session_messages')
        .delete()
        .eq('session_id', sessionId);
        
      if (messagesError) {
        console.log('Error deleting messages:', messagesError);
        // Continue anyway
      } else {
        console.log('Messages deleted successfully');
      }
    } catch (msgError) {
      console.log('Exception deleting messages:', msgError);
      // Continue anyway
    }
    
    // Now try to delete the session
    const { error: deleteError } = await adminSupabase
      .from('counseling_sessions')
      .delete()
      .eq('id', sessionId);
      
    if (deleteError) {
      console.log('Error deleting session:', deleteError);
      
      // If delete fails, try to update the status
      try {
        const { error: updateError } = await adminSupabase
          .from('counseling_sessions')
          .update({ status: 'deleted' })
          .eq('id', sessionId);
          
        if (updateError) {
          console.log('Error updating session status:', updateError);
          return NextResponse.json({
            success: false,
            error: 'Failed to delete or update session',
            details: updateError.message
          }, { status: 500 });
        }
        
        console.log('Session marked as deleted');
        return NextResponse.json({
          success: true,
          message: 'Session marked as deleted'
        });
      } catch (updateErr) {
        console.log('Exception updating session:', updateErr);
        return NextResponse.json({
          success: false,
          error: 'Exception updating session',
          details: updateErr.message
        }, { status: 500 });
      }
    }
    
    console.log('Session deleted successfully');
    return NextResponse.json({
      success: true,
      message: 'Session deleted successfully'
    });
  } catch (error) {
    console.error('Unexpected error in db-delete API:', error);
    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred',
      details: error.message
    }, { status: 500 });
  }
}
