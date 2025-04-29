-- First, check if the table exists
DO $$
DECLARE
  table_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public'
    AND table_name = 'session_messages'
  ) INTO table_exists;
  
  IF NOT table_exists THEN
    -- Create the table if it doesn't exist
    CREATE TABLE public.session_messages (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      session_id UUID REFERENCES public.counseling_sessions(id),
      sender_id UUID,
      recipient_id UUID,
      message TEXT,
      is_read BOOLEAN DEFAULT false,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
    );
    
    RAISE NOTICE 'Created session_messages table';
  ELSE
    RAISE NOTICE 'session_messages table already exists';
  END IF;
  
  -- Disable RLS completely
  ALTER TABLE public.session_messages DISABLE ROW LEVEL SECURITY;
  RAISE NOTICE 'Disabled RLS on session_messages table';
  
  -- Create the insert_message function
  CREATE OR REPLACE FUNCTION insert_message(
    p_session_id UUID,
    p_sender_id UUID,
    p_recipient_id UUID,
    p_message TEXT
  )
  RETURNS JSONB
  LANGUAGE plpgsql
  SECURITY DEFINER
  AS $$
  DECLARE
    v_result JSONB;
  BEGIN
    -- Insert the message
    INSERT INTO public.session_messages (
      session_id,
      sender_id,
      recipient_id,
      message,
      is_read
    ) VALUES (
      p_session_id,
      p_sender_id,
      p_recipient_id,
      p_message,
      false
    )
    RETURNING jsonb_build_object(
      'id', id,
      'session_id', session_id,
      'sender_id', sender_id,
      'recipient_id', recipient_id,
      'message', message,
      'is_read', is_read,
      'created_at', created_at
    ) INTO v_result;
    
    RETURN v_result;
  EXCEPTION
    WHEN OTHERS THEN
      RETURN jsonb_build_object(
        'error', SQLERRM,
        'detail', SQLSTATE
      );
  END;
  $$;
  
  RAISE NOTICE 'Created insert_message function';
END $$;
