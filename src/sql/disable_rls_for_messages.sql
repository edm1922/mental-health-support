-- Disable RLS for session_messages table to allow all operations without authentication
-- This is for testing purposes only and should be removed in production

-- First, check if the session_messages table exists
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename = 'session_messages'
  ) THEN
    -- Disable RLS for the session_messages table
    ALTER TABLE public.session_messages DISABLE ROW LEVEL SECURITY;
    
    RAISE NOTICE 'Row Level Security disabled for session_messages table';
  ELSE
    RAISE NOTICE 'session_messages table does not exist';
  END IF;
END
$$;
