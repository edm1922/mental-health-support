import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

/**
 * API endpoint to create the exec_sql function in the database
 * This is needed when the function doesn't exist and we can't use RPC to create it
 */
export async function POST(request) {
  try {
    // Initialize Supabase client
    const supabase = createRouteHandlerClient({ cookies });

    // Get the session if available
    const { data: { session } } = await supabase.auth.getSession();
    const isAdmin = session?.user ? await checkAdminStatus(supabase, session.user.id) : false;

    if (!isAdmin) {
      return NextResponse.json({ error: 'Only admins can perform this action' }, { status: 403 });
    }

    // Create the exec_sql function using direct SQL
    // This requires superuser privileges in Supabase
    const createFunctionSQL = `
      -- Drop the existing exec_sql function first if it exists
      DROP FUNCTION IF EXISTS exec_sql(text);

      -- Create RPC function for executing SQL
      CREATE OR REPLACE FUNCTION exec_sql(sql text)
      RETURNS JSONB
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      BEGIN
        EXECUTE sql;
        RETURN jsonb_build_object('success', true);
      EXCEPTION WHEN OTHERS THEN
        RETURN jsonb_build_object(
          'success', false,
          'error', SQLERRM,
          'detail', SQLSTATE
        );
      END;
      $$;
    `;

    // We need to use a direct SQL query here, not RPC
    // This is a bit of a chicken-and-egg problem since we're trying to create the exec_sql function
    // We'll use the REST API directly
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ 
        error: 'Missing Supabase URL or key in environment variables' 
      }, { status: 500 });
    }
    
    // Create the function using a direct SQL query via the REST API
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        query: createFunctionSQL
      })
    });
    
    if (!response.ok) {
      let errorMessage = response.statusText;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch (e) {
        // Ignore JSON parsing errors
      }
      
      return NextResponse.json({ 
        success: false,
        error: `Failed to create exec_sql function: ${errorMessage}`
      }, { status: 500 });
    }
    
    // Test if the function was created successfully
    const { data: testData, error: testError } = await supabase.rpc('exec_sql', {
      sql: 'SELECT 1 as test;'
    });
    
    if (testError) {
      return NextResponse.json({ 
        success: false,
        error: `Function was created but test failed: ${testError.message}`
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Successfully created exec_sql function'
    });
  } catch (error) {
    console.error('Error creating exec_sql function:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error: ' + error.message 
    }, { status: 500 });
  }
}

/**
 * Check if a user is an admin
 */
async function checkAdminStatus(supabase, userId) {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', userId)
      .single();
      
    if (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
    
    return data?.role === 'admin';
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}
