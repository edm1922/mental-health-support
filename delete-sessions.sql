-- Disable RLS on the counseling_sessions table to ensure we can delete the data
ALTER TABLE public.counseling_sessions DISABLE ROW LEVEL SECURITY;

-- Disable RLS on the session_messages table to ensure we can delete the data
ALTER TABLE public.session_messages DISABLE ROW LEVEL SECURITY;

-- Delete all session messages first (to avoid foreign key constraints)
DELETE FROM public.session_messages;

-- Delete all counseling sessions
DELETE FROM public.counseling_sessions;

-- Verify that the sessions have been deleted
SELECT COUNT(*) FROM public.counseling_sessions;

-- Verify that the messages have been deleted
SELECT COUNT(*) FROM public.session_messages;
