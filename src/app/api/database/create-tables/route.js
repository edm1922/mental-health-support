import { NextResponse } from 'next/server';
import { supabase } from '@/utils/supabaseClient';

export const dynamic = 'force-dynamic'; // This ensures the route is always dynamic

export async function POST() {
  try {
    console.log('Creating database tables...');

    // First, try to create the exec_sql function directly using raw SQL
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

    // Try to execute the SQL directly using a raw query
    try {
      const { data: rawData, error: rawError } = await supabase.rpc('exec_sql', {
        sql: createFunctionSQL
      });

      if (rawError) {
        console.error('Error creating exec_sql function:', rawError);
        // Continue anyway, as the function might already exist
      } else {
        console.log('Successfully created exec_sql function');
      }
    } catch (functionError) {
      console.error('Exception creating exec_sql function:', functionError);
      // Continue anyway, as we'll try a different approach
    }

    // Now create the user_profiles table
    const { data: userProfilesData, error: userProfilesError } = await supabase.rpc('exec_sql', {
      sql: `
        -- Create user_profiles table if it doesn't exist
        CREATE TABLE IF NOT EXISTS public.user_profiles (
          id UUID PRIMARY KEY,
          display_name TEXT,
          bio TEXT,
          image_url TEXT,
          role TEXT DEFAULT 'user',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Disable RLS for now to simplify testing
        ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;
      `
    });

    if (userProfilesError) {
      console.error('Error creating user_profiles table:', userProfilesError);

      // Try a direct SQL approach using the REST API
      try {
        // First check if the table already exists
        const { error: directError } = await supabase.from('user_profiles').select('id').limit(1);

        if (directError && directError.code === '42P01') {
          // Table doesn't exist, but we can't create it with RPC
          // Try one more approach - direct SQL through the REST API
          return NextResponse.json({
            success: false,
            error: 'Failed to create user_profiles table and RPC method not available',
            message: 'Please create the user_profiles table manually in Supabase',
            sql: `
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

              -- Create user_profiles table
              CREATE TABLE IF NOT EXISTS public.user_profiles (
                id UUID PRIMARY KEY,
                display_name TEXT,
                bio TEXT,
                image_url TEXT,
                role TEXT DEFAULT 'user',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
              );

              -- Disable RLS for now to simplify testing
              ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;
            `
          }, { status: 500 });
        }
      } catch (directException) {
        console.error('Exception checking user_profiles table:', directException);
      }
    } else {
      // If we successfully created the table, make sure RLS is disabled
      try {
        const { data: rlsData, error: rlsError } = await supabase.rpc('exec_sql', {
          sql: `ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;`
        });

        if (rlsError) {
          console.error('Error disabling RLS:', rlsError);
        } else {
          console.log('Successfully disabled RLS');
        }
      } catch (rlsException) {
        console.error('Exception disabling RLS:', rlsException);
      }
    }

    // Check if the table was created successfully using multiple approaches
    let existingTables = [];
    let hasUserProfiles = false;

    // First try using exec_sql
    try {
      const { data: sqlResult, error: sqlError } = await supabase.rpc('exec_sql', {
        sql: "SELECT tablename FROM pg_tables WHERE schemaname = 'public'"
      });

      if (!sqlError && sqlResult && sqlResult.success) {
        try {
          // Try to parse the result
          const parsedResult = JSON.parse(sqlResult.detail || '[]');
          if (Array.isArray(parsedResult)) {
            existingTables = parsedResult.map(row => row.tablename);
            hasUserProfiles = existingTables.includes('user_profiles');
          }
        } catch (parseError) {
          console.error('Error parsing SQL result:', parseError);
        }
      }
    } catch (sqlException) {
      console.error('Exception executing SQL check:', sqlException);
    }

    // If the first approach failed, try the direct query
    if (existingTables.length === 0) {
      try {
        const { data: tableList, error: tableListError } = await supabase
          .from('pg_tables')
          .select('tablename')
          .eq('schemaname', 'public');

        if (!tableListError && tableList) {
          existingTables = tableList.map(t => t.tablename);
          hasUserProfiles = existingTables.includes('user_profiles');
        } else {
          console.error('Error fetching tables after creation:', tableListError);
        }
      } catch (queryException) {
        console.error('Exception querying tables:', queryException);
      }
    }

    // If both approaches failed, try a direct check for user_profiles
    if (existingTables.length === 0) {
      try {
        const { data: userProfilesCheck, error: userProfilesError } = await supabase
          .from('user_profiles')
          .select('id')
          .limit(1);

        // If we don't get a "relation does not exist" error, the table exists
        if (!userProfilesError || userProfilesError.code !== '42P01') {
          hasUserProfiles = true;
          existingTables = ['user_profiles']; // We know at least this table exists
        }
      } catch (checkException) {
        console.error('Exception checking user_profiles:', checkException);
      }
    }

    return NextResponse.json({
      success: hasUserProfiles,
      tables: existingTables,
      message: hasUserProfiles
        ? 'user_profiles table created successfully'
        : 'Failed to create user_profiles table'
    });
  } catch (error) {
    console.error('Error creating database tables:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Unknown error',
      message: 'Failed to create database tables'
    }, { status: 500 });
  }
}
