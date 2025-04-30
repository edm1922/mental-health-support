import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    // Initialize Supabase client
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    console.log('CHECK CONSTRAINTS: Starting check');
    
    // Check table structure
    const tableSql = `
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'session_messages';
    `;
    
    const { data: tableStructure, error: tableError } = await supabase.rpc('exec_sql', {
      sql: tableSql
    });
    
    if (tableError) {
      console.error('CHECK CONSTRAINTS: Error checking table structure:', tableError);
      return NextResponse.json({
        success: false,
        error: 'Error checking table structure',
        details: tableError.message
      }, { status: 500 });
    }
    
    // Check foreign key constraints
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
    
    if (constraintsError) {
      console.error('CHECK CONSTRAINTS: Error checking constraints:', constraintsError);
      return NextResponse.json({
        success: false,
        error: 'Error checking constraints',
        details: constraintsError.message
      }, { status: 500 });
    }
    
    // Check existing users in user_profiles
    const usersSql = `
      SELECT id, display_name, role 
      FROM public.user_profiles 
      LIMIT 10;
    `;
    
    const { data: users, error: usersError } = await supabase.rpc('exec_sql', {
      sql: usersSql
    });
    
    if (usersError) {
      console.error('CHECK CONSTRAINTS: Error checking users:', usersError);
      return NextResponse.json({
        success: false,
        error: 'Error checking users',
        details: usersError.message
      }, { status: 500 });
    }
    
    // Check existing sessions in counseling_sessions
    const sessionsSql = `
      SELECT id, counselor_id, patient_id, status 
      FROM public.counseling_sessions 
      LIMIT 10;
    `;
    
    const { data: sessions, error: sessionsError } = await supabase.rpc('exec_sql', {
      sql: sessionsSql
    });
    
    if (sessionsError) {
      console.error('CHECK CONSTRAINTS: Error checking sessions:', sessionsError);
      return NextResponse.json({
        success: false,
        error: 'Error checking sessions',
        details: sessionsError.message
      }, { status: 500 });
    }
    
    // Check if the session ID exists
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    
    let sessionExists = null;
    let sessionDetails = null;
    
    if (sessionId) {
      const sessionCheckSql = `
        SELECT * FROM public.counseling_sessions 
        WHERE id = '${sessionId}'::uuid;
      `;
      
      const { data: sessionCheck, error: sessionCheckError } = await supabase.rpc('exec_sql', {
        sql: sessionCheckSql
      });
      
      if (sessionCheckError) {
        console.error('CHECK CONSTRAINTS: Error checking session:', sessionCheckError);
      } else {
        sessionExists = sessionCheck && sessionCheck.length > 0;
        sessionDetails = sessionCheck;
      }
    }
    
    return NextResponse.json({
      success: true,
      tableStructure,
      constraints,
      users,
      sessions,
      sessionId,
      sessionExists,
      sessionDetails
    });
  } catch (error) {
    console.error('CHECK CONSTRAINTS: Unexpected error:', error);
    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred',
      details: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
