import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    // Initialize Supabase client
    const supabase = createRouteHandlerClient({ cookies });

    // Get the session if available
    const { data: { session } } = await supabase.auth.getSession();
    console.log('Session:', session ? 'User is authenticated' : 'No session');

    // Check if the user is an admin
    if (session) {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (!profile || profile.role !== 'admin') {
        return NextResponse.json(
          { error: 'Only administrators can create RPC functions' },
          { status: 403 }
        );
      }
    } else {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Create the exec_sql function
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        -- Create the exec_sql function if it doesn't exist
        CREATE OR REPLACE FUNCTION exec_sql(sql text) RETURNS void AS $$
        BEGIN
          EXECUTE sql;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
      `
    });

    // If the function doesn't exist yet, we'll get an error
    if (error && error.message.includes('function exec_sql(text) does not exist')) {
      // Create the function directly using SQL
      const { error: createError } = await supabase.from('_temp_create_function').select('*').limit(1);
      
      // Check if we can create the function
      if (createError) {
        return NextResponse.json(
          { 
            error: 'Failed to create RPC function: ' + createError.message,
            message: 'You may need to create this function manually in the Supabase SQL editor'
          },
          { status: 500 }
        );
      }
    } else if (error) {
      return NextResponse.json(
        { error: 'Error executing RPC function: ' + error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'RPC function created or already exists'
    });
  } catch (error) {
    console.error('Unexpected error in create-rpc API:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}
