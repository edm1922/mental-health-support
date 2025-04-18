-- Drop the existing exec_sql function first if it exists
DROP FUNCTION IF EXISTS exec_sql(text);

-- Create RPC function for executing SQL
CREATE OR REPLACE FUNCTION exec_sql(sql text)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE sql;
  RETURN jsonb_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'detail', SQLSTATE
  );
END;
$$;

-- Drop the existing table if it exists
DROP TABLE IF EXISTS public.user_profiles;

-- Create user_profiles table with UUID id
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY,
  display_name TEXT,
  bio TEXT,
  image_url TEXT,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Disable RLS for now to simplify testing
ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;

-- Insert a test profile
INSERT INTO public.user_profiles (id, display_name, role)
VALUES ('00000000-0000-0000-0000-000000000000', 'Test User', 'user')
ON CONFLICT (id) DO NOTHING;
