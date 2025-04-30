-- Create a function to fix chat policies
CREATE OR REPLACE FUNCTION fix_chat_policies()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Enable RLS on session_messages table
  ALTER TABLE public.session_messages ENABLE ROW LEVEL SECURITY;

  -- Create policy to allow users to view their own messages
  DROP POLICY IF EXISTS "Users can view their own messages" ON public.session_messages;
  CREATE POLICY "Users can view their own messages"
  ON public.session_messages
  FOR SELECT
  USING (
    sender_id::text = auth.uid()::text 
    OR recipient_id::text = auth.uid()::text
    OR EXISTS (
      SELECT 1 
      FROM counseling_sessions 
      WHERE 
        id = session_id 
        AND (counselor_id::text = auth.uid()::text OR patient_id::text = auth.uid()::text)
    )
  );

  -- Create policy to allow users to insert messages
  DROP POLICY IF EXISTS "Users can insert messages" ON public.session_messages;
  CREATE POLICY "Users can insert messages"
  ON public.session_messages
  FOR INSERT
  WITH CHECK (
    sender_id::text = auth.uid()::text
    OR EXISTS (
      SELECT 1 
      FROM counseling_sessions 
      WHERE 
        id = session_id 
        AND (counselor_id::text = auth.uid()::text OR patient_id::text = auth.uid()::text)
    )
  );

  -- Create policy to allow users to update their own messages
  DROP POLICY IF EXISTS "Users can update their own messages" ON public.session_messages;
  CREATE POLICY "Users can update their own messages"
  ON public.session_messages
  FOR UPDATE
  USING (
    sender_id::text = auth.uid()::text
    OR EXISTS (
      SELECT 1 
      FROM counseling_sessions 
      WHERE 
        id = session_id 
        AND (counselor_id::text = auth.uid()::text OR patient_id::text = auth.uid()::text)
    )
  );

  -- Create policy to allow users to delete their own messages
  DROP POLICY IF EXISTS "Users can delete their own messages" ON public.session_messages;
  CREATE POLICY "Users can delete their own messages"
  ON public.session_messages
  FOR DELETE
  USING (
    sender_id::text = auth.uid()::text
    OR EXISTS (
      SELECT 1 
      FROM counseling_sessions 
      WHERE 
        id = session_id 
        AND (counselor_id::text = auth.uid()::text OR patient_id::text = auth.uid()::text)
    )
  );

  -- Create a simpler policy for testing if needed
  -- This allows any authenticated user to see all messages
  DROP POLICY IF EXISTS "Authenticated users can view all messages" ON public.session_messages;
  CREATE POLICY "Authenticated users can view all messages"
  ON public.session_messages
  FOR SELECT
  USING (auth.role() = 'authenticated');

  RETURN json_build_object(
    'success', true,
    'message', 'Chat policies fixed successfully'
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Error fixing chat policies: ' || SQLERRM
    );
END;
$$;
