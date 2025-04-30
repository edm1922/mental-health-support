import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

// Create a direct Supabase client with admin privileges
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const adminSupabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request) {
  try {
    console.log('Creating get_active_sessions_for_user RPC function...');

    // Create the RPC function to get active sessions for a user
    const { error } = await adminSupabase.rpc('exec_sql', {
      sql: `
        CREATE OR REPLACE FUNCTION get_active_sessions_for_user(user_id TEXT, current_timestamp TIMESTAMPTZ)
        RETURNS SETOF counseling_sessions AS $$
        BEGIN
          RETURN QUERY
          SELECT *
          FROM counseling_sessions
          WHERE (counselor_id = user_id::uuid OR patient_id = user_id::uuid)
            AND status != 'deleted'
          ORDER BY session_date ASC;
        END;
        $$ LANGUAGE plpgsql;
      `
    });

    if (error) {
      console.error('Error creating RPC function:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to create RPC function',
        details: error.message
      }, { status: 500 });
    }

    console.log('RPC function created successfully');
    return NextResponse.json({
      success: true,
      message: 'RPC function created successfully'
    });
  } catch (error) {
    console.error('Unexpected error creating RPC function:', error);
    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred',
      details: error.message
    }, { status: 500 });
  }
}
