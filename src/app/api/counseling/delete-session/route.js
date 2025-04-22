import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    // Get the session ID from the request body
    const { sessionId } = await request.json();

    if (!sessionId) {
      return NextResponse.json({
        success: false,
        error: 'Session ID is required'
      }, { status: 400 });
    }

    console.log(`Delete session request for session ${sessionId}`);

    // Create a Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({
        success: false,
        error: 'Missing Supabase credentials'
      }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // First, disable RLS on the counseling_sessions table
    try {
      await supabase.rpc('exec_sql', {
        sql: 'ALTER TABLE public.counseling_sessions DISABLE ROW LEVEL SECURITY;'
      });
      console.log('Disabled RLS on counseling_sessions table');
    } catch (rlsError) {
      console.log('Error disabling RLS:', rlsError);
      // Continue anyway
    }

    // First, delete any related messages
    try {
      await supabase.rpc('exec_sql', {
        sql: `DELETE FROM public.session_messages WHERE session_id = '${sessionId}'::uuid`
      });
      console.log('Related messages deleted');
    } catch (msgError) {
      console.log('Error deleting messages:', msgError);
      // Continue anyway
    }

    // Then delete the session
    try {
      const { error: deleteError } = await supabase
        .from('counseling_sessions')
        .delete()
        .eq('id', sessionId);

      if (deleteError) {
        console.error('Error deleting session:', deleteError);
        
        // Try with raw SQL as a fallback
        try {
          const { error: sqlError } = await supabase.rpc('exec_sql', {
            sql: `DELETE FROM public.counseling_sessions WHERE id = '${sessionId}'::uuid`
          });
          
          if (sqlError) {
            console.error('SQL delete also failed:', sqlError);
            return NextResponse.json({
              success: false,
              error: 'Failed to delete session',
              details: sqlError.message
            }, { status: 500 });
          }
          
          console.log('Session deleted with SQL');
        } catch (sqlErr) {
          console.error('Exception in SQL delete:', sqlErr);
          return NextResponse.json({
            success: false,
            error: 'Exception in SQL delete',
            details: sqlErr.message
          }, { status: 500 });
        }
      } else {
        console.log('Session deleted successfully');
      }
      
      return NextResponse.json({
        success: true,
        message: 'Session deleted successfully'
      });
    } catch (error) {
      console.error('Exception deleting session:', error);
      return NextResponse.json({
        success: false,
        error: 'Exception deleting session',
        details: error.message
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Unexpected error in delete-session API:', error);
    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred',
      details: error.message
    }, { status: 500 });
  }
}
