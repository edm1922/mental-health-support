-- Create a function to insert a message
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
