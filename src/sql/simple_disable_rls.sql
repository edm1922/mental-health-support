-- Enhanced script to permanently disable RLS on session_messages and counseling_sessions tables
-- This script:
-- 1. Disables RLS on both tables
-- 2. Creates a security definer function to check and disable RLS
-- 3. Removes all existing RLS policies
-- 4. Adds a comment to the tables to indicate RLS should be disabled
-- 5. Creates a trigger to automatically disable RLS if it gets re-enabled

-- First, disable RLS on both tables
ALTER TABLE public.session_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.counseling_sessions DISABLE ROW LEVEL SECURITY;

-- Remove all existing RLS policies from session_messages
DO $$
DECLARE
  policy_record RECORD;
BEGIN
  FOR policy_record IN
    SELECT policyname
    FROM pg_policies
    WHERE tablename = 'session_messages' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.session_messages', policy_record.policyname);
    RAISE NOTICE 'Dropped policy % on session_messages', policy_record.policyname;
  END LOOP;
END
$$;

-- Add comments to the tables to indicate RLS should be disabled
COMMENT ON TABLE public.session_messages IS 'RLS DISABLED PERMANENTLY - DO NOT ENABLE';
COMMENT ON TABLE public.counseling_sessions IS 'RLS DISABLED PERMANENTLY - DO NOT ENABLE';

-- Create a function to check and disable RLS if it gets enabled
-- Using SECURITY DEFINER to ensure it runs with elevated privileges
CREATE OR REPLACE FUNCTION public.ensure_rls_disabled()
RETURNS void AS $$
DECLARE
  session_messages_rls_enabled boolean;
  counseling_sessions_rls_enabled boolean;
  policy_record RECORD;
BEGIN
  -- Check if RLS is enabled on session_messages
  SELECT relrowsecurity INTO session_messages_rls_enabled
  FROM pg_class
  WHERE relname = 'session_messages' AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

  -- Check if RLS is enabled on counseling_sessions
  SELECT relrowsecurity INTO counseling_sessions_rls_enabled
  FROM pg_class
  WHERE relname = 'counseling_sessions' AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

  -- Disable RLS if it's enabled on session_messages
  IF session_messages_rls_enabled THEN
    RAISE NOTICE 'RLS was enabled on session_messages. Disabling it...';
    ALTER TABLE public.session_messages DISABLE ROW LEVEL SECURITY;

    -- Also remove any policies that might have been added
    FOR policy_record IN
      SELECT policyname
      FROM pg_policies
      WHERE tablename = 'session_messages' AND schemaname = 'public'
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.session_messages', policy_record.policyname);
      RAISE NOTICE 'Dropped policy % on session_messages', policy_record.policyname;
    END LOOP;
  END IF;

  -- Disable RLS if it's enabled on counseling_sessions
  IF counseling_sessions_rls_enabled THEN
    RAISE NOTICE 'RLS was enabled on counseling_sessions. Disabling it...';
    ALTER TABLE public.counseling_sessions DISABLE ROW LEVEL SECURITY;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to be called by the event trigger
CREATE OR REPLACE FUNCTION public.check_rls_on_ddl()
RETURNS event_trigger AS $$
BEGIN
  -- Call the function to ensure RLS is disabled
  PERFORM public.ensure_rls_disabled();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create an event trigger that fires when tables are altered
-- This will automatically disable RLS if someone tries to enable it
DROP EVENT TRIGGER IF EXISTS disable_rls_on_ddl;
CREATE EVENT TRIGGER disable_rls_on_ddl
  ON ddl_command_end
  WHEN TAG IN ('ALTER TABLE', 'CREATE POLICY')
  EXECUTE FUNCTION public.check_rls_on_ddl();

-- Final check to make sure RLS is disabled
SELECT public.ensure_rls_disabled();

-- Output confirmation
DO $$
BEGIN
  RAISE NOTICE 'RLS has been permanently disabled on session_messages and counseling_sessions tables.';
  RAISE NOTICE 'A trigger has been created to automatically disable RLS if it gets re-enabled.';
  RAISE NOTICE 'To manually ensure RLS stays disabled, you can call the function public.ensure_rls_disabled() at any time.';
END $$;
