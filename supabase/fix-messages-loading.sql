-- Create a function to get the current user
CREATE OR REPLACE FUNCTION get_current_user()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id uuid;
  user_data jsonb;
BEGIN
  -- Get the current user ID from the auth context
  SELECT auth.uid() INTO current_user_id;

  IF current_user_id IS NULL THEN
    RETURN jsonb_build_object('authenticated', false, 'error', 'Not authenticated');
  END IF;

  -- Get user data from auth.users
  SELECT jsonb_build_object(
    'id', id,
    'email', email,
    'name', COALESCE(raw_user_meta_data->>'name', email),
    'role', role
  ) INTO user_data
  FROM auth.users
  WHERE id = current_user_id;

  IF user_data IS NULL THEN
    RETURN jsonb_build_object('authenticated', false, 'error', 'User not found');
  END IF;

  -- Return user data with authentication status
  RETURN jsonb_build_object(
    'authenticated', true,
    'user', user_data
  );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_current_user() TO authenticated;
GRANT EXECUTE ON FUNCTION get_current_user() TO anon;

-- Improved function to get messages for a user
CREATE OR REPLACE FUNCTION get_messages_for_user(user_uuid uuid)
RETURNS TABLE (
  id uuid,
  session_id uuid,
  sender_id uuid,
  recipient_id uuid,
  message text,
  is_read boolean,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Log the user ID for debugging
  RAISE NOTICE 'Getting messages for user: %', user_uuid;

  -- Check if the user exists in user_profiles
  IF NOT EXISTS (SELECT 1 FROM public.user_profiles WHERE id = user_uuid) THEN
    RAISE NOTICE 'User not found in user_profiles: %', user_uuid;
    -- Return empty result set instead of raising an exception
    RETURN;
  END IF;

  -- Return messages for the user
  RETURN QUERY
  SELECT
    sm.id,
    sm.session_id,
    sm.sender_id,
    sm.recipient_id,
    sm.message,
    sm.is_read,
    sm.created_at
  FROM
    public.session_messages sm
  WHERE
    sm.sender_id = user_uuid OR sm.recipient_id = user_uuid
  ORDER BY
    sm.created_at DESC;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_messages_for_user(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_messages_for_user(uuid) TO anon;

-- Function to check if a user has any messages
CREATE OR REPLACE FUNCTION user_has_messages(user_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  message_count integer;
BEGIN
  SELECT COUNT(*) INTO message_count
  FROM public.session_messages
  WHERE sender_id = user_uuid OR recipient_id = user_uuid;

  RETURN message_count > 0;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION user_has_messages(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION user_has_messages(uuid) TO anon;

-- Function to check if a user has any sessions
CREATE OR REPLACE FUNCTION user_has_sessions(user_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  session_count integer;
BEGIN
  SELECT COUNT(*) INTO session_count
  FROM public.counseling_sessions
  WHERE counselor_id = user_uuid OR patient_id = user_uuid;

  RETURN session_count > 0;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION user_has_sessions(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION user_has_sessions(uuid) TO anon;

-- Create a policy to allow all users to see all messages (for testing)
DROP POLICY IF EXISTS "All users can see all messages" ON public.session_messages;
CREATE POLICY "All users can see all messages"
ON public.session_messages
FOR SELECT
USING (true);
