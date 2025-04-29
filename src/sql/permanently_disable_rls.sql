-- Permanently disable RLS on session_messages and counseling_sessions tables
-- This script:
-- 1. Disables RLS on both tables
-- 2. Creates a function to check and disable RLS
-- 3. Creates a trigger that runs periodically to ensure RLS stays disabled
-- 4. Adds a comment to the tables to indicate RLS should be disabled

-- First, disable RLS on both tables
ALTER TABLE public.session_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.counseling_sessions DISABLE ROW LEVEL SECURITY;

-- Add comments to the tables to indicate RLS should be disabled
COMMENT ON TABLE public.session_messages IS 'RLS DISABLED PERMANENTLY - DO NOT ENABLE';
COMMENT ON TABLE public.counseling_sessions IS 'RLS DISABLED PERMANENTLY - DO NOT ENABLE';

-- Create a function to check and disable RLS if it gets enabled
CREATE OR REPLACE FUNCTION public.ensure_rls_disabled()
RETURNS void AS $$
DECLARE
  session_messages_rls_enabled boolean;
  counseling_sessions_rls_enabled boolean;
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
  END IF;
  
  -- Disable RLS if it's enabled on counseling_sessions
  IF counseling_sessions_rls_enabled THEN
    RAISE NOTICE 'RLS was enabled on counseling_sessions. Disabling it...';
    ALTER TABLE public.counseling_sessions DISABLE ROW LEVEL SECURITY;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to be called by the event trigger
CREATE OR REPLACE FUNCTION public.check_rls_on_alter()
RETURNS event_trigger AS $$
BEGIN
  -- Call the function to ensure RLS is disabled
  PERFORM public.ensure_rls_disabled();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create an event trigger that fires when tables are altered
DROP EVENT TRIGGER IF EXISTS disable_rls_on_alter;
CREATE EVENT TRIGGER disable_rls_on_alter
  ON ddl_command_end
  WHEN TAG IN ('ALTER TABLE')
  EXECUTE FUNCTION public.check_rls_on_alter();

-- Create a scheduled function that runs periodically to ensure RLS stays disabled
CREATE OR REPLACE FUNCTION public.scheduled_rls_check()
RETURNS void AS $$
BEGIN
  -- Call the function to ensure RLS is disabled
  PERFORM public.ensure_rls_disabled();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a cron job to run the scheduled function every hour
-- Note: This requires pg_cron extension to be enabled
-- If pg_cron is not available, you can run this function manually or through an external scheduler
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'pg_cron'
  ) THEN
    -- Schedule the function to run every hour
    SELECT cron.schedule('0 * * * *', 'SELECT public.scheduled_rls_check()');
  ELSE
    RAISE NOTICE 'pg_cron extension not available. Scheduled checks will not be created.';
  END IF;
END $$;

-- Final check to make sure RLS is disabled
SELECT public.ensure_rls_disabled();

-- Output confirmation
DO $$
BEGIN
  RAISE NOTICE 'RLS has been permanently disabled on session_messages and counseling_sessions tables.';
  RAISE NOTICE 'A trigger has been created to automatically disable RLS if it gets re-enabled.';
END $$;
