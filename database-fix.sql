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

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY,
  display_name TEXT,
  bio TEXT,
  image_url TEXT,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Grant permissions
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Create policy for users to read all profiles
CREATE POLICY "Users can read all profiles"
  ON public.user_profiles
  FOR SELECT
  USING (true);

-- Create policy for users to update their own profile
CREATE POLICY "Users can update their own profile"
  ON public.user_profiles
  FOR UPDATE
  USING (auth.uid()::uuid = id);

-- Create policy for users to insert their own profile
CREATE POLICY "Users can insert their own profile"
  ON public.user_profiles
  FOR INSERT
  WITH CHECK (auth.uid()::uuid = id);

-- Create policy for users to delete their own profile
CREATE POLICY "Users can delete their own profile"
  ON public.user_profiles
  FOR DELETE
  USING (auth.uid()::uuid = id);

-- Insert a test profile
INSERT INTO public.user_profiles (id, display_name, role)
VALUES ('00000000-0000-0000-0000-000000000000', 'Test User', 'user')
ON CONFLICT (id) DO NOTHING;
