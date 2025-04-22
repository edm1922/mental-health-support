-- Diagnose authentication and RLS issues

-- Check if the session_messages table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'session_messages'
) AS session_messages_table_exists;

-- Check RLS status on session_messages table using pg_tables instead
SELECT 
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public' 
AND tablename = 'session_messages';

-- Check existing RLS policies on session_messages
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual
FROM pg_policies
WHERE tablename = 'session_messages';

-- Check if the disable_session_messages_rls function exists
SELECT EXISTS (
  SELECT FROM pg_proc
  WHERE proname = 'disable_session_messages_rls'
) AS disable_rls_function_exists;

-- Check if the execute_sql function exists
SELECT EXISTS (
  SELECT FROM pg_proc
  WHERE proname = 'execute_sql'
) AS execute_sql_function_exists;

-- Check user_profiles table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'user_profiles'
ORDER BY ordinal_position;

-- Check counseling_sessions table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'counseling_sessions'
ORDER BY ordinal_position;

-- Create the disable_session_messages_rls function if it doesn't exist
CREATE OR REPLACE FUNCTION public.disable_session_messages_rls()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Disable RLS on the session_messages table
  ALTER TABLE public.session_messages DISABLE ROW LEVEL SECURITY;
  RETURN true;
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.disable_session_messages_rls TO authenticated;

-- Create the execute_sql function if it doesn't exist
CREATE OR REPLACE FUNCTION public.execute_sql(sql_query TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE sql_query;
  RETURN true;
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.execute_sql TO authenticated;

-- Disable RLS on session_messages table
ALTER TABLE public.session_messages DISABLE ROW LEVEL SECURITY;

-- Check if auth.uid() is working
CREATE OR REPLACE FUNCTION public.get_auth_uid()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT auth.uid();
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_auth_uid TO authenticated;

-- Create a function to check if a user exists in user_profiles
CREATE OR REPLACE FUNCTION public.check_user_exists(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.user_profiles WHERE id = user_id
  ) INTO user_exists;
  
  RETURN user_exists;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.check_user_exists TO authenticated;

-- Create a function to get a user's role
CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_role text;
BEGIN
  SELECT role INTO user_role
  FROM public.user_profiles
  WHERE id = user_id;
  
  RETURN user_role;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_role TO authenticated;
