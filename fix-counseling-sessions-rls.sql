-- Disable RLS on the counseling_sessions table
ALTER TABLE public.counseling_sessions DISABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own sessions" ON public.counseling_sessions;
DROP POLICY IF EXISTS "Users can update their own sessions" ON public.counseling_sessions;
DROP POLICY IF EXISTS "Users can delete their own sessions" ON public.counseling_sessions;
DROP POLICY IF EXISTS "Users can insert sessions" ON public.counseling_sessions;

-- Create new policies
-- Policy for users to view sessions they are part of
CREATE POLICY "Users can view their own sessions"
ON public.counseling_sessions
FOR SELECT
USING (
  auth.uid()::text = patient_id::text OR 
  auth.uid()::text = counselor_id::text
);

-- Policy for users to update sessions they are part of
CREATE POLICY "Users can update their own sessions"
ON public.counseling_sessions
FOR UPDATE
USING (
  auth.uid()::text = patient_id::text OR 
  auth.uid()::text = counselor_id::text
);

-- Policy for users to delete sessions they created
CREATE POLICY "Users can delete their own sessions"
ON public.counseling_sessions
FOR DELETE
USING (
  auth.uid()::text = patient_id::text
);

-- Policy for users to insert sessions
CREATE POLICY "Users can insert sessions"
ON public.counseling_sessions
FOR INSERT
WITH CHECK (true);

-- Keep RLS disabled for now to ensure the application can access the data
-- You can re-enable it later if needed
-- ALTER TABLE public.counseling_sessions ENABLE ROW LEVEL SECURITY;
