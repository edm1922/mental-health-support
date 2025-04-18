import { NextResponse } from 'next/server';
import { supabase } from '@/utils/supabaseClient';

export const dynamic = 'force-dynamic'; // This ensures the route is always dynamic

export async function GET() {
  try {
    console.log('Initializing database with direct SQL...');

    // First check if the user_profiles table exists
    const { data: tableCheck, error: tableCheckError } = await supabase
      .from('pg_tables')
      .select('tablename')
      .eq('schemaname', 'public')
      .eq('tablename', 'user_profiles');

    if (tableCheckError) {
      console.error('Error checking for user_profiles table:', tableCheckError);
      return NextResponse.json({
        success: false,
        error: tableCheckError.message,
        message: 'Failed to check if user_profiles table exists'
      }, { status: 500 });
    }

    // If the table already exists, return success
    if (tableCheck && tableCheck.length > 0) {
      console.log('user_profiles table already exists');
      return NextResponse.json({
        success: true,
        message: 'user_profiles table already exists',
        created: false
      });
    }

    // Create the user_profiles table using SQL
    // Note: We can't execute CREATE TABLE directly with Supabase JS client
    // So we'll use the SQL editor in the Supabase dashboard

    return NextResponse.json({
      success: false,
      message: 'Please create the user_profiles table using the SQL editor in Supabase',
      sql: `
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

-- Drop the existing exec_sql function first
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
      `
    });
  } catch (error) {
    console.error('Error in direct database initialization:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Unknown error',
      message: 'Failed to initialize database'
    }, { status: 500 });
  }
}
