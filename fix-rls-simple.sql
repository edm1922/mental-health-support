-- Create the disable_session_messages_rls function
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

-- Create the execute_sql function
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

-- Disable RLS on session_messages table directly
ALTER TABLE public.session_messages DISABLE ROW LEVEL SECURITY;
