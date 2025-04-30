import { NextResponse } from 'next/server';
import { supabase } from '@/utils/supabaseClient';

export const dynamic = 'force-dynamic'; // This ensures the route is always dynamic

export async function GET() {
  try {
    console.log('Running database fix script...');

    // First, try to create the exec_sql function
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

    // Execute the function creation SQL directly
    const { data: functionResult, error: functionError } = await supabase.rpc('exec_sql', {
      sql: createFunctionSQL
    });

    console.log('Function creation result:', { data: functionResult, error: functionError });

    // Now create the user_profiles table
    const createTableSQL = `
      -- Drop the existing table if it exists
      DROP TABLE IF EXISTS public.user_profiles;

      -- Create user_profiles table with UUID id to match auth.uid()
      CREATE TABLE IF NOT EXISTS public.user_profiles (
        id UUID PRIMARY KEY,
        display_name TEXT,
        bio TEXT,
        image_url TEXT,
        role TEXT DEFAULT 'user',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Grant permissions
      ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

      -- Create policy for users to read all profiles
      DROP POLICY IF EXISTS "Users can read all profiles" ON public.user_profiles;
      CREATE POLICY "Users can read all profiles"
        ON public.user_profiles
        FOR SELECT
        USING (true);

      -- Create policy for users to update their own profile
      DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;
      CREATE POLICY "Users can update their own profile"
        ON public.user_profiles
        FOR UPDATE
        USING (auth.uid() = id);

      -- Create policy for users to insert their own profile
      DROP POLICY IF EXISTS "Users can insert their own profile" ON public.user_profiles;
      CREATE POLICY "Users can insert their own profile"
        ON public.user_profiles
        FOR INSERT
        WITH CHECK (auth.uid() = id);

      -- Create policy for users to delete their own profile
      DROP POLICY IF EXISTS "Users can delete their own profile" ON public.user_profiles;
      CREATE POLICY "Users can delete their own profile"
        ON public.user_profiles
        FOR DELETE
        USING (auth.uid() = id);
    `;

    const { data: tableResult, error: tableError } = await supabase.rpc('exec_sql', {
      sql: createTableSQL
    });

    console.log('Table creation result:', { data: tableResult, error: tableError });

    // Try to create a test user profile
    const testId = crypto.randomUUID();

    const { data: insertData, error: insertError } = await supabase
      .from('user_profiles')
      .insert([
        {
          id: testId,
          display_name: 'Test User',
          role: 'user',
        }
      ])
      .select();

    console.log('Test profile creation result:', { data: insertData, error: insertError });

    // Check if the table exists
    const { data: checkData, error: checkError } = await supabase
      .from('user_profiles')
      .select('id')
      .limit(1);

    console.log('Table check result:', { data: checkData, error: checkError });

    return NextResponse.json({
      success: true,
      functionResult,
      functionError,
      tableResult,
      tableError,
      insertData,
      insertError,
      checkData,
      checkError,
      message: 'Database fix script executed'
    });
  } catch (error) {
    console.error('Exception in database fix script:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      message: 'Exception occurred during database fix'
    }, { status: 500 });
  }
}
