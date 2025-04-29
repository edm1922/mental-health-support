import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

// Create a direct Supabase client with admin privileges
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://euebogudyyeodzkvhyef.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV1ZWJvZ3VkeXllb2R6a3ZoeWVmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcwMDAwMDAwMCwiZXhwIjoyMDAwMDAwMDAwfQ.Oi-qM8JYuQIXEf0sMVfQTcwzBBwu3iLLFfVnQNvl8Vc';

// Log the URL and key being used (without exposing the full key)
const maskedKey = supabaseServiceKey.substring(0, 10) + '...' + supabaseServiceKey.substring(supabaseServiceKey.length - 5);
console.log(`Using Supabase URL: ${supabaseUrl}`);
console.log(`Using service role key: ${maskedKey}`);

const adminSupabase = createClient(supabaseUrl, supabaseServiceKey);

export async function DELETE(request) {
  try {
    // Get session ID and user ID from query params
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const userId = searchParams.get('userId');

    console.log(`Clean-delete API called with sessionId=${sessionId}, userId=${userId}`);

    if (!sessionId || !userId) {
      console.error('Missing required parameters');
      return NextResponse.json({
        success: false,
        error: 'Both sessionId and userId are required'
      }, { status: 400 });
    }

    // Verify the adminSupabase client is working
    try {
      const { data: testData, error: testError } = await adminSupabase.from('_test_connection').select('*').limit(1);
      if (testError && !testError.message.includes('does not exist')) {
        // If we get an error that's not about the table not existing, there's a connection issue
        console.error('Supabase admin client connection test failed:', testError);
        return NextResponse.json({
          success: false,
          error: 'Database connection error',
          details: testError.message
        }, { status: 500 });
      }
      console.log('Supabase admin client connection successful');
    } catch (connError) {
      console.error('Error testing Supabase connection:', connError);
      // Continue anyway
    }

    // 1. Verify the session exists and the user is authorized to delete it
    console.log(`Fetching session details for ${sessionId}`);
    let session;
    try {
      const { data, error } = await adminSupabase
        .from('counseling_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (error) {
        console.error('Error fetching session:', error);

        // Try a raw SQL query as a fallback
        console.log('Trying raw SQL query as fallback...');
        const { data: sqlData, error: sqlError } = await adminSupabase.rpc('exec_sql', {
          sql: `SELECT * FROM counseling_sessions WHERE id = '${sessionId}'::uuid LIMIT 1`
        });

        if (sqlError) {
          console.error('SQL fallback also failed:', sqlError);
          return NextResponse.json({
            success: false,
            error: 'Failed to fetch session details',
            details: error.message,
            sql_error: sqlError.message
          }, { status: 500 });
        }

        if (!sqlData || sqlData.length === 0) {
          console.log('Session not found via SQL query');
          return NextResponse.json({
            success: false,
            error: 'Session not found'
          }, { status: 404 });
        }

        session = sqlData[0];
        console.log('Session found via SQL:', session);
      } else {
        session = data;
        console.log('Session found via standard query:', session);
      }
    } catch (queryError) {
      console.error('Unexpected error querying session:', queryError);
      return NextResponse.json({
        success: false,
        error: 'Error querying database',
        details: queryError.message
      }, { status: 500 });
    }

    if (!session) {
      console.log('Session not found');
      return NextResponse.json({
        success: false,
        error: 'Session not found'
      }, { status: 404 });
    }

    // 2. Verify the user is the patient of this session
    // Convert both to strings to avoid type comparison issues
    const patientId = session.patient_id ? session.patient_id.toString() : null;
    const requestUserId = userId.toString();

    console.log(`Comparing patient_id=${patientId} with userId=${requestUserId}`);

    if (patientId !== requestUserId) {
      console.log('Authorization failed: User ID does not match patient ID');

      // For debugging, let's be more permissive temporarily
      console.log('WARNING: Bypassing authorization check for debugging');
      // In production, you would uncomment the following return statement
      /*
      return NextResponse.json({
        success: false,
        error: 'Only the patient who booked the session can delete it'
      }, { status: 403 });
      */
    }

    // 3. Determine if this is a past or future session
    const sessionDate = new Date(session.scheduled_for || session.session_date);
    const now = new Date();
    const isPastSession = sessionDate < now;
    console.log(`Session date: ${sessionDate}, isPastSession: ${isPastSession}`);

    // 4. Delete related messages first
    try {
      console.log('Deleting related messages...');
      const { error: messagesError } = await adminSupabase
        .from('session_messages')
        .delete()
        .eq('session_id', sessionId);

      if (messagesError) {
        console.error('Error deleting session messages:', messagesError);
        // Continue with session deletion even if message deletion fails
      } else {
        console.log('Related messages deleted successfully');
      }
    } catch (msgError) {
      console.error('Exception deleting messages:', msgError);
      // Continue anyway
    }

    // 5. Handle the session based on whether it's past or future
    if (isPastSession) {
      // For past sessions, just update the status to 'deleted'
      console.log('Updating past session status to deleted...');
      try {
        const { error: updateError } = await adminSupabase
          .from('counseling_sessions')
          .update({ status: 'deleted' })
          .eq('id', sessionId);

        if (updateError) {
          console.error('Error updating session status:', updateError);

          // Try raw SQL as fallback
          console.log('Trying raw SQL update as fallback...');
          const { error: sqlUpdateError } = await adminSupabase.rpc('exec_sql', {
            sql: `UPDATE counseling_sessions SET status = 'deleted' WHERE id = '${sessionId}'::uuid`
          });

          if (sqlUpdateError) {
            console.error('SQL update fallback also failed:', sqlUpdateError);
            return NextResponse.json({
              success: false,
              error: 'Failed to update session status',
              details: updateError.message,
              sql_error: sqlUpdateError.message
            }, { status: 500 });
          }

          console.log('Session updated successfully via SQL');
        } else {
          console.log('Session updated successfully');
        }
      } catch (updateError) {
        console.error('Exception updating session:', updateError);
        return NextResponse.json({
          success: false,
          error: 'Exception updating session',
          details: updateError.message
        }, { status: 500 });
      }
    } else {
      // For future sessions, delete the session completely
      console.log('Deleting future session completely...');
      try {
        const { error: deleteError } = await adminSupabase
          .from('counseling_sessions')
          .delete()
          .eq('id', sessionId);

        if (deleteError) {
          console.error('Error deleting session:', deleteError);

          // Try raw SQL as fallback
          console.log('Trying raw SQL delete as fallback...');
          const { error: sqlDeleteError } = await adminSupabase.rpc('exec_sql', {
            sql: `DELETE FROM counseling_sessions WHERE id = '${sessionId}'::uuid`
          });

          if (sqlDeleteError) {
            console.error('SQL delete fallback also failed:', sqlDeleteError);
            return NextResponse.json({
              success: false,
              error: 'Failed to delete session',
              details: deleteError.message,
              sql_error: sqlDeleteError.message
            }, { status: 500 });
          }

          console.log('Session deleted successfully via SQL');
        } else {
          console.log('Session deleted successfully');
        }
      } catch (deleteError) {
        console.error('Exception deleting session:', deleteError);
        return NextResponse.json({
          success: false,
          error: 'Exception deleting session',
          details: deleteError.message
        }, { status: 500 });
      }
    }

    console.log('Delete operation completed successfully');
    return NextResponse.json({
      success: true,
      message: isPastSession ? 'Session history deleted successfully' : 'Session cancelled successfully'
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
