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
    const sessionId = searchParams.get('sessionId') || 'f19de89f-506a-4207-aa21-f09bda8d0dfb';
    
    console.log('DEBUG: Starting debug for session', sessionId);
    
    // Step 1: Check if the session_messages table exists
    const tableCheckSql = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'session_messages'
      );
    `;
    
    const { data: tableExists, error: tableError } = await supabase.rpc('exec_sql', {
      sql: tableCheckSql
    });
    
    // Step 2: Check if the user_profiles exist
    const userCheckSql = `
      SELECT * FROM public.user_profiles 
      WHERE id IN ('4fd19577-3876-4087-b18b-51a7b194460a', '1ccdfb9d-df48-4250-ba89-68c181b8c012');
    `;
    
    const { data: usersExist, error: userError } = await supabase.rpc('exec_sql', {
      sql: userCheckSql
    });
    
    // Step 3: Check if the counseling session exists
    const sessionCheckSql = `
      SELECT * FROM public.counseling_sessions 
      WHERE id = '${sessionId}'::uuid;
    `;
    
    const { data: sessionExists, error: sessionError } = await supabase.rpc('exec_sql', {
      sql: sessionCheckSql
    });
    
    // Step 4: Check for any messages in the session
    const messagesCheckSql = `
      SELECT * FROM public.session_messages 
      WHERE session_id = '${sessionId}'::uuid;
    `;
    
    const { data: messagesExist, error: messagesError } = await supabase.rpc('exec_sql', {
      sql: messagesCheckSql
    });
    
    // Step 5: Try to insert a test message using the Supabase client directly
    const { data: directInsert, error: directError } = await supabase
      .from('session_messages')
      .insert({
        session_id: sessionId,
        sender_id: '4fd19577-3876-4087-b18b-51a7b194460a',
        recipient_id: '1ccdfb9d-df48-4250-ba89-68c181b8c012',
        message: `Direct insert test at ${new Date().toISOString()}`
      })
      .select();
    
    // Step 6: Try to insert a test message using SQL
    const insertSql = `
      INSERT INTO public.session_messages (
        session_id, 
        sender_id, 
        recipient_id, 
        message
      ) VALUES (
        '${sessionId}'::uuid, 
        '4fd19577-3876-4087-b18b-51a7b194460a'::uuid, 
        '1ccdfb9d-df48-4250-ba89-68c181b8c012'::uuid, 
        'SQL insert test at ${new Date().toISOString()}'
      ) RETURNING *;
    `;
    
    const { data: sqlInsert, error: sqlError } = await supabase.rpc('exec_sql', {
      sql: insertSql
    });
    
    // Step 7: Check for foreign key constraints
    const constraintsSql = `
      SELECT
        tc.constraint_name,
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM
        information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name = 'session_messages';
    `;
    
    const { data: constraints, error: constraintsError } = await supabase.rpc('exec_sql', {
      sql: constraintsSql
    });
    
    // Step 8: Check RLS status
    const rlsSql = `
      SELECT relname, relrowsecurity
      FROM pg_class
      WHERE relname = 'session_messages';
    `;
    
    const { data: rlsStatus, error: rlsError } = await supabase.rpc('exec_sql', {
      sql: rlsSql
    });
    
    // Step 9: Check policies
    const policiesSql = `
      SELECT * FROM pg_policies WHERE tablename = 'session_messages';
    `;
    
    const { data: policies, error: policiesError } = await supabase.rpc('exec_sql', {
      sql: policiesSql
    });
    
    // Compile all results
    return NextResponse.json({
      success: true,
      sessionId,
      tableCheck: {
        exists: tableExists,
        error: tableError?.message
      },
      userCheck: {
        users: usersExist,
        error: userError?.message
      },
      sessionCheck: {
        session: sessionExists,
        error: sessionError?.message
      },
      messagesCheck: {
        messages: messagesExist,
        error: messagesError?.message
      },
      directInsert: {
        result: directInsert,
        error: directError?.message
      },
      sqlInsert: {
        result: sqlInsert,
        error: sqlError?.message
      },
      constraints: {
        list: constraints,
        error: constraintsError?.message
      },
      rls: {
        status: rlsStatus,
        error: rlsError?.message
      },
      policies: {
        list: policies,
        error: policiesError?.message
      }
    });
  } catch (error) {
    console.error('DEBUG: Unexpected error:', error);
    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred',
      details: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
