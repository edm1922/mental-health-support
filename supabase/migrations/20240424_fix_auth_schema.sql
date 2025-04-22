-- This script fixes issues with the auth schema and adds functions to work with bigint IDs

-- First, check if the auth_users table exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'auth_users'
  ) THEN
    RAISE NOTICE 'Creating auth_users table...';
    
    -- Create auth_users table if it doesn't exist
    CREATE TABLE public.auth_users (
      id BIGINT PRIMARY KEY,
      name TEXT,
      email TEXT UNIQUE,
      emailVerified TIMESTAMP WITH TIME ZONE,
      image TEXT
    );
  ELSE
    RAISE NOTICE 'auth_users table already exists';
  END IF;
  
  -- Check if auth_accounts table exists
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'auth_accounts'
  ) THEN
    RAISE NOTICE 'Creating auth_accounts table...';
    
    -- Create auth_accounts table if it doesn't exist
    CREATE TABLE public.auth_accounts (
      id BIGINT PRIMARY KEY,
      userId BIGINT REFERENCES public.auth_users(id),
      type TEXT,
      provider TEXT,
      providerAccountId BIGINT,
      refresh_token TEXT,
      access_token TEXT,
      expires_at TEXT,
      id_token TEXT,
      scope TEXT,
      session_state TEXT,
      token_type TEXT,
      password TEXT
    );
  ELSE
    RAISE NOTICE 'auth_accounts table already exists';
  END IF;
  
  -- Check if auth_sessions table exists
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'auth_sessions'
  ) THEN
    RAISE NOTICE 'Creating auth_sessions table...';
    
    -- Create auth_sessions table if it doesn't exist
    CREATE TABLE public.auth_sessions (
      id BIGINT PRIMARY KEY,
      userId BIGINT REFERENCES public.auth_users(id),
      expires TIMESTAMP WITH TIME ZONE,
      sessionToken TEXT UNIQUE
    );
  ELSE
    RAISE NOTICE 'auth_sessions table already exists';
  END IF;
  
  -- Check if auth_verification_token table exists
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'auth_verification_token'
  ) THEN
    RAISE NOTICE 'Creating auth_verification_token table...';
    
    -- Create auth_verification_token table if it doesn't exist
    CREATE TABLE public.auth_verification_token (
      identifier TEXT,
      token TEXT UNIQUE,
      expires TIMESTAMP WITH TIME ZONE
    );
  ELSE
    RAISE NOTICE 'auth_verification_token table already exists';
  END IF;
END $$;

-- Create function to check authentication using bigint IDs
CREATE OR REPLACE FUNCTION public.check_auth_direct()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id bigint;
  user_data jsonb;
BEGIN
  -- Get the current user ID from the auth context
  SELECT auth.uid()::bigint INTO current_user_id;
  
  IF current_user_id IS NULL THEN
    RETURN jsonb_build_object('authenticated', false, 'error', 'Not authenticated');
  END IF;
  
  -- Get user data from auth_users table
  SELECT jsonb_build_object(
    'id', id,
    'email', email,
    'name', name
  ) INTO user_data
  FROM public.auth_users
  WHERE id = current_user_id;
  
  IF user_data IS NULL THEN
    -- User not found in auth_users
    RETURN jsonb_build_object(
      'authenticated', false,
      'error', 'User not found in auth_users'
    );
  END IF;
  
  -- Return user data with authentication status
  RETURN jsonb_build_object(
    'authenticated', true,
    'user', user_data
  );
END;
$$;

-- Create function to get messages for a user with bigint ID
CREATE OR REPLACE FUNCTION public.get_messages_for_user(user_id_param bigint)
RETURNS TABLE (
  session_id uuid,
  message text,
  sender_id uuid,
  recipient_id uuid,
  created_at timestamptz,
  is_read boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user exists
  IF NOT EXISTS (SELECT 1 FROM public.auth_users WHERE id = user_id_param) THEN
    RAISE EXCEPTION 'User not found';
  END IF;
  
  -- Convert bigint ID to UUID for compatibility with session_messages table
  RETURN QUERY
  SELECT 
    sm.session_id,
    sm.message,
    sm.sender_id,
    sm.recipient_id,
    sm.created_at,
    sm.is_read
  FROM 
    public.session_messages sm
  WHERE 
    sm.sender_id = user_id_param::uuid OR sm.recipient_id = user_id_param::uuid
  ORDER BY 
    sm.created_at DESC;
END;
$$;

-- Create function to get the current user's ID as bigint
CREATE OR REPLACE FUNCTION public.get_current_user_id()
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id bigint;
BEGIN
  -- Get the current user ID from the auth context
  SELECT auth.uid()::bigint INTO current_user_id;
  RETURN current_user_id;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.check_auth_direct() TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_auth_direct() TO anon;
GRANT EXECUTE ON FUNCTION public.get_messages_for_user(bigint) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_current_user_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_current_user_id() TO anon;

-- Create a function to map UUID to bigint for compatibility
CREATE OR REPLACE FUNCTION public.uuid_to_bigint(id uuid)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result bigint;
BEGIN
  -- Simple hash function to convert UUID to bigint
  -- This is not perfect but works for demonstration
  SELECT ('x' || substr(id::text, 1, 16))::bit(64)::bigint INTO result;
  RETURN result;
END;
$$;

-- Create a function to map bigint to UUID for compatibility
CREATE OR REPLACE FUNCTION public.bigint_to_uuid(id bigint)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result uuid;
BEGIN
  -- Convert bigint to UUID format
  -- This is not perfect but works for demonstration
  SELECT uuid_generate_v5(
    '00000000-0000-0000-0000-000000000000'::uuid,
    id::text
  ) INTO result;
  RETURN result;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.uuid_to_bigint(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.uuid_to_bigint(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.bigint_to_uuid(bigint) TO authenticated;
GRANT EXECUTE ON FUNCTION public.bigint_to_uuid(bigint) TO anon;
