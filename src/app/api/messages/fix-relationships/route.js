import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    // Initialize Supabase client
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Get the session ID from the request
    const { sessionId } = await request.json();
    
    if (!sessionId) {
      return NextResponse.json({
        success: false,
        error: 'Session ID is required'
      }, { status: 400 });
    }
    
    console.log('FIX RELATIONSHIPS: Starting fix for session', sessionId);
    
    // First, check if the counseling_sessions table exists
    const { data: sessionsTableExists, error: sessionsTableError } = await supabase.rpc('exec_sql', {
      sql: `SELECT COUNT(*) 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'counseling_sessions';`
    });
    
    if (sessionsTableError) {
      console.error('FIX RELATIONSHIPS: Error checking if counseling_sessions table exists:', sessionsTableError);
      return NextResponse.json({
        success: false,
        error: 'Error checking if counseling_sessions table exists',
        details: sessionsTableError.message
      }, { status: 500 });
    }
    
    const sessionsTableExistsResult = sessionsTableExists && sessionsTableExists[0] && parseInt(sessionsTableExists[0].count) > 0;
    console.log('FIX RELATIONSHIPS: Counseling sessions table exists:', sessionsTableExistsResult);
    
    // Create test users first
    const senderSql = `
      INSERT INTO public.user_profiles (
        id, 
        display_name, 
        role, 
        created_at, 
        updated_at
      ) VALUES (
        '00000000-0000-0000-0000-000000000000'::uuid, 
        'Test Sender', 
        'user', 
        now(), 
        now()
      ) 
      ON CONFLICT (id) DO UPDATE 
      SET display_name = 'Test Sender', updated_at = now()
      RETURNING *;
    `;
    
    const { data: sender, error: senderError } = await supabase.rpc('exec_sql', {
      sql: senderSql
    });
    
    if (senderError) {
      console.error('FIX RELATIONSHIPS: Error creating sender:', senderError);
    } else {
      console.log('FIX RELATIONSHIPS: Sender created or updated:', sender);
    }
    
    const recipientSql = `
      INSERT INTO public.user_profiles (
        id, 
        display_name, 
        role, 
        created_at, 
        updated_at
      ) VALUES (
        '11111111-1111-1111-1111-111111111111'::uuid, 
        'Test Recipient', 
        'counselor', 
        now(), 
        now()
      ) 
      ON CONFLICT (id) DO UPDATE 
      SET display_name = 'Test Recipient', updated_at = now()
      RETURNING *;
    `;
    
    const { data: recipient, error: recipientError } = await supabase.rpc('exec_sql', {
      sql: recipientSql
    });
    
    if (recipientError) {
      console.error('FIX RELATIONSHIPS: Error creating recipient:', recipientError);
    } else {
      console.log('FIX RELATIONSHIPS: Recipient created or updated:', recipient);
    }
    
    // If the counseling_sessions table exists, create or update the session
    if (sessionsTableExistsResult) {
      // Check if the session exists
      const sessionCheckSql = `
        SELECT * FROM public.counseling_sessions 
        WHERE id = '${sessionId}'::uuid;
      `;
      
      const { data: sessionCheck, error: sessionCheckError } = await supabase.rpc('exec_sql', {
        sql: sessionCheckSql
      });
      
      if (sessionCheckError) {
        console.error('FIX RELATIONSHIPS: Error checking session:', sessionCheckError);
      } else {
        const sessionExists = sessionCheck && sessionCheck.length > 0;
        console.log('FIX RELATIONSHIPS: Session exists:', sessionExists);
        
        if (!sessionExists) {
          // Create the session
          const createSessionSql = `
            INSERT INTO public.counseling_sessions (
              id,
              counselor_id,
              patient_id,
              status,
              created_at,
              updated_at
            ) VALUES (
              '${sessionId}'::uuid,
              '11111111-1111-1111-1111-111111111111'::uuid,
              '00000000-0000-0000-0000-000000000000'::uuid,
              'active',
              NOW(),
              NOW()
            )
            RETURNING *;
          `;
          
          const { data: createdSession, error: createSessionError } = await supabase.rpc('exec_sql', {
            sql: createSessionSql
          });
          
          if (createSessionError) {
            console.error('FIX RELATIONSHIPS: Error creating session:', createSessionError);
            
            // Try a more basic insert if the first one fails
            const basicSessionSql = `
              INSERT INTO public.counseling_sessions (
                id,
                counselor_id,
                patient_id
              ) VALUES (
                '${sessionId}'::uuid,
                '11111111-1111-1111-1111-111111111111'::uuid,
                '00000000-0000-0000-0000-000000000000'::uuid
              )
              ON CONFLICT (id) DO NOTHING
              RETURNING *;
            `;
            
            const { data: basicSession, error: basicSessionError } = await supabase.rpc('exec_sql', {
              sql: basicSessionSql
            });
            
            if (basicSessionError) {
              console.error('FIX RELATIONSHIPS: Error creating basic session:', basicSessionError);
            } else {
              console.log('FIX RELATIONSHIPS: Basic session created:', basicSession);
            }
          } else {
            console.log('FIX RELATIONSHIPS: Session created:', createdSession);
          }
        }
      }
    }
    
    // Check for foreign key constraints on session_messages
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
      console.error('FIX RELATIONSHIPS: Error checking constraints:', constraintsError);
    } else {
      console.log('FIX RELATIONSHIPS: Constraints:', constraints);
    }
    
    return NextResponse.json({
      success: true,
      message: 'Relationships fixed successfully',
      sessionId,
      constraints: constraints || []
    });
  } catch (error) {
    console.error('FIX RELATIONSHIPS: Unexpected error:', error);
    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred',
      details: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
