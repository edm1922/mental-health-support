-- Create a function to disable RLS on the session_messages table
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
