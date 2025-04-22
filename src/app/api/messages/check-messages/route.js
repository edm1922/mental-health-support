import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    // Initialize Supabase client
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Get session ID from query params
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    console.log('CHECK MESSAGES: Starting database check');

    // Check if the session_messages table exists - use a more direct approach
    const tableCheckSql = `
      SELECT COUNT(*)
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name = 'session_messages';
    `;

    const { data: tableExists, error: tableError } = await supabase.rpc('exec_sql', {
      sql: tableCheckSql
    });

    if (tableError) {
      console.error('CHECK MESSAGES: Error checking if table exists:', tableError);
      return NextResponse.json({
        success: false,
        error: 'Error checking if table exists',
        details: tableError.message
      }, { status: 500 });
    }

    const tableExistsResult = tableExists && tableExists[0] && parseInt(tableExists[0].count) > 0;
    console.log('CHECK MESSAGES: Table exists check result:', tableExists);
    console.log('CHECK MESSAGES: Table exists:', tableExistsResult);

    if (!tableExistsResult) {
      return NextResponse.json({
        success: false,
        tableExists: false,
        message: 'The session_messages table does not exist',
        checkResult: tableExists
      });
    }

    // Get table structure
    const structureSql = `
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'session_messages' AND table_schema = 'public';
    `;

    const { data: structure, error: structureError } = await supabase.rpc('exec_sql', {
      sql: structureSql
    });

    if (structureError) {
      console.error('CHECK MESSAGES: Error getting table structure:', structureError);
      return NextResponse.json({
        success: false,
        error: 'Error getting table structure',
        details: structureError.message
      }, { status: 500 });
    }

    console.log('CHECK MESSAGES: Table structure:', structure);

    // Count total messages in the table
    const countAllSql = `
      SELECT COUNT(*) FROM public.session_messages;
    `;

    const { data: countAll, error: countAllError } = await supabase.rpc('exec_sql', {
      sql: countAllSql
    });

    if (countAllError) {
      console.error('CHECK MESSAGES: Error counting all messages:', countAllError);
      return NextResponse.json({
        success: false,
        error: 'Error counting all messages',
        details: countAllError.message
      }, { status: 500 });
    }

    console.log('CHECK MESSAGES: Total message count:', countAll);

    // If a session ID was provided, count messages for that session
    let sessionMessages = null;
    let sessionCount = null;

    if (sessionId) {
      // Count messages for this session
      const countSessionSql = `
        SELECT COUNT(*) FROM public.session_messages
        WHERE session_id = '${sessionId}'::uuid;
      `;

      const { data: countSession, error: countSessionError } = await supabase.rpc('exec_sql', {
        sql: countSessionSql
      });

      if (countSessionError) {
        console.error('CHECK MESSAGES: Error counting session messages:', countSessionError);
        return NextResponse.json({
          success: false,
          error: 'Error counting session messages',
          details: countSessionError.message
        }, { status: 500 });
      }

      console.log('CHECK MESSAGES: Session message count:', countSession);
      sessionCount = countSession;

      // Get messages for this session
      const sessionMessagesSql = `
        SELECT * FROM public.session_messages
        WHERE session_id = '${sessionId}'::uuid
        ORDER BY created_at ASC;
      `;

      const { data: messages, error: messagesError } = await supabase.rpc('exec_sql', {
        sql: sessionMessagesSql
      });

      if (messagesError) {
        console.error('CHECK MESSAGES: Error getting session messages:', messagesError);
        return NextResponse.json({
          success: false,
          error: 'Error getting session messages',
          details: messagesError.message
        }, { status: 500 });
      }

      console.log('CHECK MESSAGES: Session messages:', messages);
      sessionMessages = messages;
    }

    // Get all sessions
    const sessionsSql = `
      SELECT DISTINCT session_id FROM public.session_messages;
    `;

    const { data: sessions, error: sessionsError } = await supabase.rpc('exec_sql', {
      sql: sessionsSql
    });

    if (sessionsError) {
      console.error('CHECK MESSAGES: Error getting sessions:', sessionsError);
      return NextResponse.json({
        success: false,
        error: 'Error getting sessions',
        details: sessionsError.message
      }, { status: 500 });
    }

    console.log('CHECK MESSAGES: All sessions:', sessions);

    return NextResponse.json({
      success: true,
      tableExists: true,
      tableStructure: structure,
      totalMessages: countAll,
      sessions: sessions,
      sessionId: sessionId,
      sessionCount: sessionCount,
      sessionMessages: sessionMessages
    });
  } catch (error) {
    console.error('CHECK MESSAGES: Unexpected error:', error);
    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred',
      details: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
