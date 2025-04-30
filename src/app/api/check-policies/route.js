import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Initialize Supabase client with cookies
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    console.log('Check policies API called');
    
    // Get the current session
    const { data: { session } } = await supabase.auth.getSession();
    
    // Check if user is authenticated
    if (!session) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 });
    }
    
    // Get the RLS policies for the session_messages table
    const { data: policies, error: policiesError } = await supabase.rpc('exec_sql', { 
      sql: `
      SELECT
        schemaname,
        tablename,
        policyname,
        permissive,
        roles,
        cmd,
        qual,
        with_check
      FROM
        pg_policies
      WHERE
        tablename = 'session_messages'
      ORDER BY
        policyname;
      `
    });
    
    if (policiesError) {
      console.error('Error getting policies:', policiesError);
      return NextResponse.json({
        success: false,
        error: 'Failed to get policies: ' + policiesError.message
      });
    }
    
    // Try to insert a test message
    const testSessionId = '00000000-0000-0000-0000-000000000000';
    const testMessage = 'Test message from check-policies API at ' + new Date().toISOString();
    
    const { data: insertResult, error: insertError } = await supabase
      .from('session_messages')
      .insert({
        session_id: testSessionId,
        sender_id: session.user.id,
        recipient_id: session.user.id,
        message: testMessage,
        is_read: false
      })
      .select();
    
    // Try to select messages
    const { data: selectResult, error: selectError } = await supabase
      .from('session_messages')
      .select('*')
      .limit(5);
    
    return NextResponse.json({
      success: true,
      user: {
        id: session.user.id,
        email: session.user.email,
        role: session.user.role
      },
      policies: policies,
      insertTest: {
        success: !insertError,
        error: insertError ? insertError.message : null,
        data: insertResult
      },
      selectTest: {
        success: !selectError,
        error: selectError ? selectError.message : null,
        count: selectResult ? selectResult.length : 0
      }
    });
  } catch (error) {
    console.error('Error in check policies API:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
