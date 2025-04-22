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

    console.log(`SQL-delete request for session ${sessionId}`);

    // Create a fresh Supabase client for each request
    const adminSupabase = createClient(supabaseUrl, supabaseServiceKey);

    // Ensure the SQL execution function exists
    try {
      // Try to create the function first
      await fetch('/api/db/create-sql-function', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      console.log('SQL function creation requested');
    } catch (fnError) {
      console.log('Error requesting SQL function creation:', fnError);
      // Continue anyway
    }

    // First try to delete any related messages using direct SQL
    try {
      const { data: msgResult, error: msgError } = await adminSupabase.rpc('exec_sql', {
        sql: `DELETE FROM public.session_messages WHERE session_id = '${sessionId}'::uuid`
      });

      if (msgError) {
        console.log('Error deleting messages with SQL:', msgError);
        // Continue anyway
      } else {
        console.log('Messages deleted with SQL');
      }
    } catch (msgErr) {
      console.log('Exception in message SQL delete:', msgErr);
      // Continue anyway
    }

    // Then delete the session using direct SQL
    try {
      const { data: sessionResult, error: sessionError } = await adminSupabase.rpc('exec_sql', {
        sql: `DELETE FROM public.counseling_sessions WHERE id = '${sessionId}'::uuid`
      });

      if (sessionError) {
        console.log('Error deleting session with SQL:', sessionError);

        // If delete fails, try to update the status
        try {
          const { data: updateResult, error: updateError } = await adminSupabase.rpc('exec_sql', {
            sql: `UPDATE public.counseling_sessions SET status = 'deleted' WHERE id = '${sessionId}'::uuid`
          });

          if (updateError) {
            console.log('Error updating session status with SQL:', updateError);
            return NextResponse.json({
              success: false,
              error: 'Failed to delete or update session',
              details: updateError.message
            }, { status: 500 });
          }

          console.log('Session marked as deleted with SQL');
          return NextResponse.json({
            success: true,
            message: 'Session marked as deleted'
          });
        } catch (updateErr) {
          console.log('Exception in update SQL:', updateErr);
          return NextResponse.json({
            success: false,
            error: 'Exception in SQL update',
            details: updateErr.message
          }, { status: 500 });
        }
      }

      console.log('Session deleted with SQL');
      return NextResponse.json({
        success: true,
        message: 'Session deleted successfully with SQL'
      });
    } catch (deleteErr) {
      console.log('Exception in session SQL delete:', deleteErr);
      return NextResponse.json({
        success: false,
        error: 'Exception in SQL delete',
        details: deleteErr.message
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Unexpected error in SQL-delete API:', error);
    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred',
      details: error.message
    }, { status: 500 });
  }
}
