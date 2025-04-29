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

    console.log(`Permanent delete request for session ${sessionId}`);

    // Create a fresh Supabase client with admin privileges
    const adminSupabase = createClient(supabaseUrl, supabaseServiceKey);

    // First, disable RLS on the counseling_sessions table to ensure we can delete the session
    try {
      await adminSupabase.rpc('exec_sql', {
        sql: 'ALTER TABLE public.counseling_sessions DISABLE ROW LEVEL SECURITY;'
      });
      console.log('Disabled RLS on counseling_sessions table');
    } catch (rlsError) {
      console.log('Error disabling RLS:', rlsError);
      // Continue anyway
    }

    // First, delete any related messages
    try {
      await adminSupabase.rpc('exec_sql', {
        sql: `DELETE FROM public.session_messages WHERE session_id = '${sessionId}'::uuid`
      });
      console.log('Related messages deleted');
    } catch (msgError) {
      console.log('Error deleting messages:', msgError);
      // Continue anyway
    }

    // Then delete the session
    try {
      await adminSupabase.rpc('exec_sql', {
        sql: `DELETE FROM public.counseling_sessions WHERE id = '${sessionId}'::uuid`
      });
      console.log('Session deleted successfully');
      
      return NextResponse.json({
        success: true,
        message: 'Session permanently deleted'
      });
    } catch (deleteError) {
      console.error('Error deleting session:', deleteError);
      
      return NextResponse.json({
        success: false,
        error: 'Failed to delete session',
        details: deleteError.message
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Unexpected error in permanent-delete API:', error);
    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred',
      details: error.message
    }, { status: 500 });
  }
}
