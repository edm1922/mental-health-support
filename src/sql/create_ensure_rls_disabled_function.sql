-- Function to ensure RLS is disabled on important tables
CREATE OR REPLACE FUNCTION public.ensure_rls_disabled()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Disable RLS on session_messages table
  EXECUTE 'ALTER TABLE public.session_messages DISABLE ROW LEVEL SECURITY;';
  
  -- Disable RLS on counseling_sessions table
  EXECUTE 'ALTER TABLE public.counseling_sessions DISABLE ROW LEVEL SECURITY;';
  
  -- Add comments to indicate RLS should be disabled
  EXECUTE 'COMMENT ON TABLE public.session_messages IS ''RLS DISABLED PERMANENTLY - DO NOT ENABLE'';';
  EXECUTE 'COMMENT ON TABLE public.counseling_sessions IS ''RLS DISABLED PERMANENTLY - DO NOT ENABLE'';';
END;
$$;
