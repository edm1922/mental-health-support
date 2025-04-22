-- Disable RLS on user_profiles to allow direct modifications
ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;

-- Make sure the user_profiles table has all the necessary columns
DO $$
BEGIN
  -- Add mental health fields if they don't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'mental_health_interests') THEN
    ALTER TABLE public.user_profiles ADD COLUMN mental_health_interests TEXT[] DEFAULT '{}';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'support_preferences') THEN
    ALTER TABLE public.user_profiles ADD COLUMN support_preferences TEXT[] DEFAULT '{}';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'comfort_level_sharing') THEN
    ALTER TABLE public.user_profiles ADD COLUMN comfort_level_sharing TEXT DEFAULT 'moderate';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'emergency_contact') THEN
    ALTER TABLE public.user_profiles ADD COLUMN emergency_contact TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'goals') THEN
    ALTER TABLE public.user_profiles ADD COLUMN goals TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'preferred_resources') THEN
    ALTER TABLE public.user_profiles ADD COLUMN preferred_resources TEXT[] DEFAULT '{}';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'triggers') THEN
    ALTER TABLE public.user_profiles ADD COLUMN triggers TEXT[] DEFAULT '{}';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'coping_strategies') THEN
    ALTER TABLE public.user_profiles ADD COLUMN coping_strategies TEXT[] DEFAULT '{}';
  END IF;

  -- Add counselor fields if they don't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'credentials') THEN
    ALTER TABLE public.user_profiles ADD COLUMN credentials TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'years_experience') THEN
    ALTER TABLE public.user_profiles ADD COLUMN years_experience INTEGER;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'specializations') THEN
    ALTER TABLE public.user_profiles ADD COLUMN specializations TEXT[] DEFAULT '{}';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'availability_hours') THEN
    ALTER TABLE public.user_profiles ADD COLUMN availability_hours TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'professional_bio') THEN
    ALTER TABLE public.user_profiles ADD COLUMN professional_bio TEXT;
  END IF;

  -- Add contact method field if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'preferred_contact_method') THEN
    ALTER TABLE public.user_profiles ADD COLUMN preferred_contact_method TEXT DEFAULT 'app';
  END IF;

  -- Add last_active field if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'last_active') THEN
    ALTER TABLE public.user_profiles ADD COLUMN last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
END $$;

-- Create or replace the exec_sql function to allow executing SQL from the application
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

-- Keep RLS disabled for now to ensure the application can update profiles
-- You can re-enable it later with proper policies if needed
-- ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to start fresh
DROP POLICY IF EXISTS "Users can read all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can delete their own profile" ON public.user_profiles;

-- Create permissive policies that will work with both UUID and string IDs
CREATE POLICY "Users can read all profiles"
  ON public.user_profiles
  FOR SELECT
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON public.user_profiles
  FOR UPDATE
  USING (auth.uid()::text = id::text);

CREATE POLICY "Users can insert their own profile"
  ON public.user_profiles
  FOR INSERT
  WITH CHECK (auth.uid()::text = id::text);

CREATE POLICY "Users can delete their own profile"
  ON public.user_profiles
  FOR DELETE
  USING (auth.uid()::text = id::text);

-- Show the current schema of the user_profiles table
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM 
  information_schema.columns
WHERE 
  table_schema = 'public' 
  AND table_name = 'user_profiles'
ORDER BY 
  ordinal_position;
