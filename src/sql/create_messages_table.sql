-- Create messages table for counselor-patient communication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename = 'session_messages'
  ) THEN
    -- Create the session_messages table
    CREATE TABLE public.session_messages (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      session_id UUID NOT NULL REFERENCES public.counseling_sessions(id) ON DELETE CASCADE,
      sender_id UUID NOT NULL,
      recipient_id UUID NOT NULL,
      message TEXT NOT NULL,
      is_read BOOLEAN DEFAULT false,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Add indexes for better performance
    CREATE INDEX IF NOT EXISTS session_messages_session_id_idx ON public.session_messages(session_id);
    CREATE INDEX IF NOT EXISTS session_messages_sender_id_idx ON public.session_messages(sender_id);
    CREATE INDEX IF NOT EXISTS session_messages_recipient_id_idx ON public.session_messages(recipient_id);
    CREATE INDEX IF NOT EXISTS session_messages_is_read_idx ON public.session_messages(is_read);

    -- Add RLS policies
    ALTER TABLE public.session_messages ENABLE ROW LEVEL SECURITY;

    -- Policy to allow users to see messages they sent or received
    CREATE POLICY "Users can see their own messages"
      ON public.session_messages
      FOR SELECT
      USING (
        auth.uid() = sender_id OR
        auth.uid() = recipient_id
      );

    -- Policy to allow users to insert messages
    CREATE POLICY "Users can insert messages"
      ON public.session_messages
      FOR INSERT
      WITH CHECK (
        auth.uid() = sender_id
      );

    -- Policy to allow users to update read status of messages they received
    CREATE POLICY "Users can update read status of received messages"
      ON public.session_messages
      FOR UPDATE
      USING (
        auth.uid() = recipient_id
      );
  END IF;
END
$$;
