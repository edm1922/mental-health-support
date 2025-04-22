import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    // Initialize Supabase client
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    console.log('FIX RLS: Attempting to disable RLS for session_messages table');

    // First check if the table exists
    const { data: tableExists, error: tableExistsError } = await supabase.rpc('exec_sql', {
      sql: `SELECT COUNT(*)
            FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_name = 'session_messages';`
    });

    if (tableExistsError) {
      console.error('FIX RLS: Error checking if table exists:', tableExistsError);
      return NextResponse.json({
        success: false,
        error: 'Error checking if table exists',
        details: tableExistsError.message
      }, { status: 500 });
    }

    const tableExistsResult = tableExists && tableExists[0] && parseInt(tableExists[0].count) > 0;
    console.log('FIX RLS: Table exists check result:', tableExists);
    console.log('FIX RLS: Table exists:', tableExistsResult);

    if (!tableExistsResult) {
      console.log('FIX RLS: Table does not exist, creating it');

      // Create the table
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
        console.error('FIX RLS: Error creating table:', createError);
        return NextResponse.json({
          success: false,
          error: 'Error creating table',
          details: createError.message
        }, { status: 500 });
      }

      console.log('FIX RLS: Table created successfully');
    }

    // Disable RLS on the session_messages table
    const disableRlsSql = `
      ALTER TABLE public.session_messages DISABLE ROW LEVEL SECURITY;
    `;

    const { error: disableRlsError } = await supabase.rpc('exec_sql', {
      sql: disableRlsSql
    });

    if (disableRlsError) {
      console.error('FIX RLS: Error disabling RLS on session_messages:', disableRlsError);
      return NextResponse.json({
        success: false,
        error: 'Error disabling RLS on session_messages',
        details: disableRlsError.message
      }, { status: 500 });
    }

    console.log('FIX RLS: RLS disabled successfully on session_messages');

    // Also disable RLS on the counseling_sessions table
    const disableCounselingRlsSql = `
      ALTER TABLE public.counseling_sessions DISABLE ROW LEVEL SECURITY;
    `;

    const { error: disableCounselingRlsError } = await supabase.rpc('exec_sql', {
      sql: disableCounselingRlsSql
    });

    if (disableCounselingRlsError) {
      console.error('FIX RLS: Error disabling RLS on counseling_sessions:', disableCounselingRlsError);
      // Continue even if this fails, as the session_messages table is more important
      console.log('FIX RLS: Continuing despite error with counseling_sessions table');
    } else {
      console.log('FIX RLS: RLS disabled successfully on counseling_sessions');
    }

    // Check if there are any policies on the table
    const { data: policies, error: policiesError } = await supabase.rpc('exec_sql', {
      sql: `SELECT * FROM pg_policies WHERE tablename = 'session_messages';`
    });

    if (policiesError) {
      console.error('FIX RLS: Error checking policies:', policiesError);
    } else {
      console.log('FIX RLS: Policies:', policies);

      // Drop any existing policies
      if (policies && policies.length > 0) {
        for (const policy of policies) {
          const dropPolicySql = `
            DROP POLICY IF EXISTS "${policy.policyname}" ON public.session_messages;
          `;

          const { error: dropPolicyError } = await supabase.rpc('exec_sql', {
            sql: dropPolicySql
          });

          if (dropPolicyError) {
            console.error(`FIX RLS: Error dropping policy ${policy.policyname}:`, dropPolicyError);
          } else {
            console.log(`FIX RLS: Policy ${policy.policyname} dropped successfully`);
          }
        }
      }
    }

    // Create a permissive policy
    const createPolicySql = `
      CREATE POLICY "Allow all operations" ON public.session_messages
      FOR ALL
      USING (true)
      WITH CHECK (true);
    `;

    const { error: createPolicyError } = await supabase.rpc('exec_sql', {
      sql: createPolicySql
    });

    if (createPolicyError) {
      console.error('FIX RLS: Error creating policy:', createPolicyError);
    } else {
      console.log('FIX RLS: Permissive policy created successfully');
    }

    return NextResponse.json({
      success: true,
      message: 'RLS disabled successfully'
    });
  } catch (error) {
    console.error('FIX RLS: Unexpected error:', error);
    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred',
      details: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
