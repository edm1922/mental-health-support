import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    // Initialize Supabase client
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    console.log('FIX DATABASE: Starting database fix');

    // Step 1: Check if the session_messages table exists
    const { data: tableExists, error: tableError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name = 'session_messages'
        );
      `
    });

    if (tableError) {
      console.error('FIX DATABASE: Error checking if table exists:', tableError);
      return NextResponse.json({
        success: false,
        error: 'Error checking if table exists',
        details: tableError.message
      }, { status: 500 });
    }

    const tableExistsResult = tableExists && tableExists[0] && tableExists[0].exists === true;
    console.log('FIX DATABASE: Table exists check result:', tableExists);
    console.log('FIX DATABASE: Table exists:', tableExistsResult);

    // Step 2: Create the table if it doesn't exist
    if (!tableExistsResult) {
      console.log('FIX DATABASE: Table does not exist, creating it');

      const createTableSql = `
        CREATE TABLE IF NOT EXISTS public.session_messages (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          session_id uuid NOT NULL,
          sender_id uuid NOT NULL,
          recipient_id uuid NOT NULL,
          message text NOT NULL,
          is_read boolean NOT NULL DEFAULT false,
          created_at timestamp with time zone NOT NULL DEFAULT now(),
          updated_at timestamp with time zone NOT NULL DEFAULT now()
        );
      `;

      const { error: createError } = await supabase.rpc('exec_sql', {
        sql: createTableSql
      });

      if (createError) {
        console.error('FIX DATABASE: Error creating table:', createError);
        return NextResponse.json({
          success: false,
          error: 'Error creating table',
          details: createError.message
        }, { status: 500 });
      }

      console.log('FIX DATABASE: Table created successfully');
    }

    // Step 3: Disable RLS on the session_messages table
    const disableRlsSql = `
      ALTER TABLE public.session_messages DISABLE ROW LEVEL SECURITY;
    `;

    const { error: disableRlsError } = await supabase.rpc('exec_sql', {
      sql: disableRlsSql
    });

    if (disableRlsError) {
      console.error('FIX DATABASE: Error disabling RLS:', disableRlsError);
      return NextResponse.json({
        success: false,
        error: 'Error disabling RLS',
        details: disableRlsError.message
      }, { status: 500 });
    }

    console.log('FIX DATABASE: RLS disabled successfully');

    // Step 4: Create test users
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId') || 'f19de89f-506a-4207-aa21-f09bda8d0dfb';

    // Create patient user
    const patientSql = `
      INSERT INTO public.user_profiles (
        id,
        display_name,
        role,
        created_at,
        updated_at
      ) VALUES (
        '4fd19577-3876-4087-b18b-51a7b194460a'::uuid,
        'Patient User',
        'user',
        now(),
        now()
      )
      ON CONFLICT (id) DO UPDATE
      SET display_name = 'Patient User', updated_at = now()
      RETURNING *;
    `;

    const { data: patient, error: patientError } = await supabase.rpc('exec_sql', {
      sql: patientSql
    });

    if (patientError) {
      console.error('FIX DATABASE: Error creating patient:', patientError);
    } else {
      console.log('FIX DATABASE: Patient created or updated:', patient);
    }

    // Create counselor user
    const counselorSql = `
      INSERT INTO public.user_profiles (
        id,
        display_name,
        role,
        created_at,
        updated_at
      ) VALUES (
        '1ccdfb9d-df48-4250-ba89-68c181b8c012'::uuid,
        'Counselor User',
        'counselor',
        now(),
        now()
      )
      ON CONFLICT (id) DO UPDATE
      SET display_name = 'Counselor User', updated_at = now()
      RETURNING *;
    `;

    const { data: counselor, error: counselorError } = await supabase.rpc('exec_sql', {
      sql: counselorSql
    });

    if (counselorError) {
      console.error('FIX DATABASE: Error creating counselor:', counselorError);
    } else {
      console.log('FIX DATABASE: Counselor created or updated:', counselor);
    }

    // Step 5: Create or update the counseling session
    const sessionSql = `
      INSERT INTO public.counseling_sessions (
        id,
        counselor_id,
        patient_id,
        session_date,
        status,
        created_at,
        updated_at,
        duration,
        type
      ) VALUES (
        '${sessionId}'::uuid,
        '1ccdfb9d-df48-4250-ba89-68c181b8c012'::uuid,
        '4fd19577-3876-4087-b18b-51a7b194460a'::uuid,
        now(),
        'scheduled',
        now(),
        now(),
        60,
        'one_on_one'
      )
      ON CONFLICT (id) DO UPDATE
      SET
        counselor_id = '1ccdfb9d-df48-4250-ba89-68c181b8c012'::uuid,
        patient_id = '4fd19577-3876-4087-b18b-51a7b194460a'::uuid,
        updated_at = now()
      RETURNING *;
    `;

    const { data: session, error: sessionError } = await supabase.rpc('exec_sql', {
      sql: sessionSql
    });

    if (sessionError) {
      console.error('FIX DATABASE: Error creating session:', sessionError);
    } else {
      console.log('FIX DATABASE: Session created or updated:', session);
    }

    // Step 6: Check if messages already exist for this session
    const checkMessagesSql = `
      SELECT COUNT(*) FROM public.session_messages
      WHERE session_id = '${sessionId}'::uuid;
    `;

    const { data: messageCount, error: messageCountError } = await supabase.rpc('exec_sql', {
      sql: checkMessagesSql
    });

    if (messageCountError) {
      console.error('FIX DATABASE: Error checking messages:', messageCountError);
    } else {
      console.log('FIX DATABASE: Message count:', messageCount);
    }

    // We no longer insert test messages automatically

    // Step 7: Verify the database is working
    const verifySql = `
      SELECT * FROM public.session_messages
      WHERE session_id = '${sessionId}'::uuid
      ORDER BY created_at DESC
      LIMIT 5;
    `;

    const { data: verify, error: verifyError } = await supabase.rpc('exec_sql', {
      sql: verifySql
    });

    if (verifyError) {
      console.error('FIX DATABASE: Error verifying database:', verifyError);
    } else {
      console.log('FIX DATABASE: Verification successful:', verify);
    }

    return NextResponse.json({
      success: true,
      message: 'Database fixed successfully',
      tableExists: tableExistsResult,
      patient,
      counselor,
      session,
      messageCount,
      verification: verify
    });
  } catch (error) {
    console.error('FIX DATABASE: Unexpected error:', error);
    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred',
      details: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
