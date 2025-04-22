import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

// Create a direct Supabase client with admin privileges
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://euebogudyyeodzkvhyef.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV1ZWJvZ3VkeXllb2R6a3ZoeWVmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcwMDAwMDAwMCwiZXhwIjoyMDAwMDAwMDAwfQ.Oi-qM8JYuQIXEf0sMVfQTcwzBBwu3iLLFfVnQNvl8Vc';
const adminSupabase = createClient(supabaseUrl, supabaseServiceKey);

export async function DELETE(request) {
  try {
    // Get session ID and user ID from query params
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const userId = searchParams.get('userId');

    console.log(`Direct-delete API called with sessionId=${sessionId}, userId=${userId}`);

    if (!sessionId) {
      return NextResponse.json({
        success: false,
        error: 'Session ID is required'
      }, { status: 400 });
    }

    // Try to delete the session directly using SQL
    try {
      // First delete any related messages
      console.log('Deleting related messages...');
      const { error: messagesError } = await adminSupabase.rpc('exec_sql', {
        sql: `DELETE FROM session_messages WHERE session_id = '${sessionId}'::uuid`
      });

      if (messagesError) {
        console.error('Error deleting messages:', messagesError);
        // Continue anyway
      } else {
        console.log('Messages deleted successfully');
      }

      // Then delete the session
      console.log('Deleting session...');
      const { error: sessionError } = await adminSupabase.rpc('exec_sql', {
        sql: `DELETE FROM counseling_sessions WHERE id = '${sessionId}'::uuid`
      });

      if (sessionError) {
        console.error('Error deleting session:', sessionError);
        return NextResponse.json({
          success: false,
          error: 'Failed to delete session',
          details: sessionError.message
        }, { status: 500 });
      }

      console.log('Session deleted successfully');
      return NextResponse.json({
        success: true,
        message: 'Session deleted successfully'
      });
    } catch (sqlError) {
      console.error('SQL error:', sqlError);
      return NextResponse.json({
        success: false,
        error: 'Database error',
        details: sqlError.message
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Unexpected error in direct-delete API:', error);
    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred',
      details: error.message
    }, { status: 500 });
  }
}
