-- Disable RLS on the counseling_sessions table to ensure we can delete the data
ALTER TABLE public.counseling_sessions DISABLE ROW LEVEL SECURITY;

-- Disable RLS on the session_messages table to ensure we can delete the data
ALTER TABLE public.session_messages DISABLE ROW LEVEL SECURITY;

-- Replace 'YOUR_SESSION_ID' with the actual session ID you want to delete
-- You can find the session ID in the URL when viewing a session or in the browser console logs

-- Delete related session messages first (to avoid foreign key constraints)
DELETE FROM public.session_messages 
WHERE session_id = 'YOUR_SESSION_ID'::uuid;

-- Delete the specific counseling session
DELETE FROM public.counseling_sessions 
WHERE id = 'YOUR_SESSION_ID'::uuid;

-- Verify that the session has been deleted
SELECT COUNT(*) FROM public.counseling_sessions 
WHERE id = 'YOUR_SESSION_ID'::uuid;
