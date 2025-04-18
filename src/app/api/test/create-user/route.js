import { NextResponse } from 'next/server';
import { supabase } from '@/utils/supabaseClient';

export const dynamic = 'force-dynamic'; // This ensures the route is always dynamic

export async function GET() {
  try {
    console.log('Test create user API called');

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

      console.log('Create function result:', { data: rawData, error: rawError });
    } catch (functionError) {
      console.error('Exception creating exec_sql function:', functionError);
    }

    // Now create the user_profiles table
    try {
      const { data: tableData, error: tableError } = await supabase.rpc('exec_sql', {
        sql: `
          -- Drop the existing table if it exists
          DROP TABLE IF EXISTS public.user_profiles;
          
          -- Create user_profiles table with UUID id
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

      console.log('Create table result:', { data: tableData, error: tableError });
    } catch (tableError) {
      console.error('Exception creating table:', tableError);
    }

    // Create a test user
    try {
      // Generate a test UUID
      const testId = crypto.randomUUID();
      
      // Try to insert a test profile
      console.log('Inserting test profile with ID:', testId);
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
      
      console.log('Insert result:', { data: insertData, error: insertError });
      
      return NextResponse.json({
        success: !insertError,
        testId,
        data: insertData,
        error: insertError,
        message: insertError ? 'Failed to create test profile' : 'Test profile created successfully'
      });
    } catch (error) {
      console.error('Exception in test API:', error);
      return NextResponse.json({
        success: false,
        error: error.message,
        message: 'Exception occurred'
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Exception in test API:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      message: 'Exception occurred'
    }, { status: 500 });
  }
}
