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

    console.log(`Emergency delete request for session ${sessionId}`);

    // This is a last resort endpoint that just deletes the session without any checks
    // It's meant to be used only when all other methods fail

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

    // Try all possible approaches to delete the session
    let sessionDeleted = false;

    // 1. First try to delete any related messages
    try {
      // Try direct delete first
      const { error: messagesError } = await adminSupabase
        .from('session_messages')
        .delete()
        .eq('session_id', sessionId);

      if (messagesError) {
        console.log('Error deleting messages with direct delete:', messagesError);

        // Try SQL delete as fallback
        try {
          const { error: sqlError } = await adminSupabase.rpc('exec_sql', {
            sql: `DELETE FROM public.session_messages WHERE session_id = '${sessionId}'::uuid`
          });

          if (sqlError) {
            console.log('Error deleting messages with SQL:', sqlError);
          } else {
            console.log('Messages deleted with SQL');
          }
        } catch (sqlErr) {
          console.log('Exception in SQL delete of messages:', sqlErr);
        }
      } else {
        console.log('Messages deleted successfully with direct delete');
      }
    } catch (msgError) {
      console.log('Exception deleting messages:', msgError);
    }

    // 2. Try to delete the session with direct delete
    try {
      const { error: deleteError } = await adminSupabase
        .from('counseling_sessions')
        .delete()
        .eq('id', sessionId);

      if (!deleteError) {
        console.log('Session deleted successfully with direct delete');
        sessionDeleted = true;
      } else {
        console.log('Error with direct delete:', deleteError);
      }
    } catch (directErr) {
      console.log('Exception in direct delete:', directErr);
    }

    // 3. If direct delete failed, try SQL delete
    if (!sessionDeleted) {
      try {
        const { error: sqlError } = await adminSupabase.rpc('exec_sql', {
          sql: `DELETE FROM public.counseling_sessions WHERE id = '${sessionId}'::uuid`
        });

        if (!sqlError) {
          console.log('Session deleted successfully with SQL delete');
          sessionDeleted = true;
        } else {
          console.log('Error with SQL delete:', sqlError);
        }
      } catch (sqlErr) {
        console.log('Exception in SQL delete:', sqlErr);
      }
    }

    // 4. If both deletes failed, try to mark as deleted
    if (!sessionDeleted) {
      try {
        const { error: updateError } = await adminSupabase
          .from('counseling_sessions')
          .update({ status: 'deleted' })
          .eq('id', sessionId);

        if (!updateError) {
          console.log('Session marked as deleted with direct update');
          sessionDeleted = true;
        } else {
          console.log('Error marking session as deleted:', updateError);

          // Try SQL update as last resort
          try {
            const { error: sqlUpdateError } = await adminSupabase.rpc('exec_sql', {
              sql: `UPDATE public.counseling_sessions SET status = 'deleted' WHERE id = '${sessionId}'::uuid`
            });

            if (!sqlUpdateError) {
              console.log('Session marked as deleted with SQL update');
              sessionDeleted = true;
            } else {
              console.log('Error with SQL update:', sqlUpdateError);
            }
          } catch (sqlUpdateErr) {
            console.log('Exception in SQL update:', sqlUpdateErr);
          }
        }
      } catch (updateErr) {
        console.log('Exception marking session as deleted:', updateErr);
      }
    }

    // 5. Final verification
    try {
      const { data: sessionData, error: checkError } = await adminSupabase
        .from('counseling_sessions')
        .select('id, status')
        .eq('id', sessionId)
        .single();

      if (checkError) {
        if (checkError.code === 'PGRST116') {
          console.log('Verification confirms session is deleted');
          sessionDeleted = true;
        } else {
          console.log('Error verifying session deletion:', checkError);
        }
      } else if (sessionData) {
        if (sessionData.status === 'deleted') {
          console.log('Verification confirms session is marked as deleted');
          sessionDeleted = true;
        } else {
          console.log('Verification shows session still exists with status:', sessionData.status);
        }
      }
    } catch (verifyErr) {
      console.log('Exception verifying session deletion:', verifyErr);
    }

    // Return success even if we couldn't delete it - the client will handle it
    return NextResponse.json({
      success: true,
      deleted: sessionDeleted,
      message: sessionDeleted ? 'Session deleted or marked as deleted' : 'Failed to delete session but returning success for client handling'
    });
  } catch (error) {
    console.error('Unexpected error in emergency delete API:', error);
    // Return success anyway to let the client continue
    return NextResponse.json({
      success: true,
      error: 'An error occurred but returning success for client handling',
      details: error.message
    });
  }
}
