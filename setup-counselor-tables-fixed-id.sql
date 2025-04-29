-- Setup tables for counselor application and video call functionality

-- First, check if the counselor_applications table exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'counselor_applications'
  ) THEN
    -- Create the counselor_applications table
    CREATE TABLE public.counselor_applications (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES auth.users(id),
      credentials TEXT NOT NULL,
      years_experience INTEGER NOT NULL,
      specializations TEXT NOT NULL,
      summary TEXT NOT NULL,
      phone TEXT,
      license_url TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    RAISE NOTICE 'Created counselor_applications table';
  ELSE
    RAISE NOTICE 'counselor_applications table already exists';
  END IF;
END
$$;

-- Add video call related fields to counseling_sessions table if they don't exist
DO $$
BEGIN
  -- Add video_enabled column
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'counseling_sessions' 
    AND column_name = 'video_enabled'
  ) THEN
    ALTER TABLE public.counseling_sessions ADD COLUMN video_enabled BOOLEAN DEFAULT false;
    RAISE NOTICE 'Added video_enabled column to counseling_sessions';
  ELSE
    RAISE NOTICE 'video_enabled column already exists in counseling_sessions';
  END IF;

  -- Add video_room_id column
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'counseling_sessions' 
    AND column_name = 'video_room_id'
  ) THEN
    ALTER TABLE public.counseling_sessions ADD COLUMN video_room_id TEXT;
    RAISE NOTICE 'Added video_room_id column to counseling_sessions';
  ELSE
    RAISE NOTICE 'video_room_id column already exists in counseling_sessions';
  END IF;

  -- Add video_join_url column
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'counseling_sessions' 
    AND column_name = 'video_join_url'
  ) THEN
    ALTER TABLE public.counseling_sessions ADD COLUMN video_join_url TEXT;
    RAISE NOTICE 'Added video_join_url column to counseling_sessions';
  ELSE
    RAISE NOTICE 'video_join_url column already exists in counseling_sessions';
  END IF;
END
$$;

-- Set up Row Level Security (RLS) policies for counselor_applications
ALTER TABLE public.counselor_applications ENABLE ROW LEVEL SECURITY;

-- Check for the actual column name that stores the user ID
DO $$
DECLARE
  user_id_column TEXT;
BEGIN
  -- Look for common user ID column names
  SELECT column_name INTO user_id_column
  FROM information_schema.columns
  WHERE table_schema = 'public'
  AND table_name = 'counselor_applications'
  AND column_name IN ('user_id', 'userId', 'id')
  LIMIT 1;
  
  RAISE NOTICE 'Found user ID column: %', user_id_column;
  
  -- If we found a column, create policies using that column name
  IF user_id_column IS NOT NULL THEN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Users can read their own applications" ON public.counselor_applications;
    DROP POLICY IF EXISTS "Users can insert their own applications" ON public.counselor_applications;
    DROP POLICY IF EXISTS "Admins can read all applications" ON public.counselor_applications;
    DROP POLICY IF EXISTS "Admins can update applications" ON public.counselor_applications;
    
    -- Create new policies with the correct column name
    IF user_id_column = 'user_id' THEN
      -- Policy for users to read their own applications
      CREATE POLICY "Users can read their own applications"
        ON public.counselor_applications
        FOR SELECT
        USING (auth.uid()::uuid = user_id);
      
      -- Policy for users to insert their own applications
      CREATE POLICY "Users can insert their own applications"
        ON public.counselor_applications
        FOR INSERT
        WITH CHECK (auth.uid()::uuid = user_id);
    ELSIF user_id_column = 'userId' THEN
      -- Policy for users to read their own applications
      CREATE POLICY "Users can read their own applications"
        ON public.counselor_applications
        FOR SELECT
        USING (auth.uid()::uuid = userId);
      
      -- Policy for users to insert their own applications
      CREATE POLICY "Users can insert their own applications"
        ON public.counselor_applications
        FOR INSERT
        WITH CHECK (auth.uid()::uuid = userId);
    ELSIF user_id_column = 'id' THEN
      -- Policy for users to read their own applications
      CREATE POLICY "Users can read their own applications"
        ON public.counselor_applications
        FOR SELECT
        USING (auth.uid()::uuid = id);
      
      -- Policy for users to insert their own applications
      CREATE POLICY "Users can insert their own applications"
        ON public.counselor_applications
        FOR INSERT
        WITH CHECK (auth.uid()::uuid = id);
    END IF;
    
    -- Policy for admins to read all applications
    CREATE POLICY "Admins can read all applications"
      ON public.counselor_applications
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.user_profiles
          WHERE id = auth.uid() AND role = 'admin'
        )
      );
    
    -- Policy for admins to update applications
    CREATE POLICY "Admins can update applications"
      ON public.counselor_applications
      FOR UPDATE
      USING (
        EXISTS (
          SELECT 1 FROM public.user_profiles
          WHERE id = auth.uid() AND role = 'admin'
        )
      );
      
    RAISE NOTICE 'Created policies for counselor_applications table';
  ELSE
    RAISE NOTICE 'Could not find user ID column in counselor_applications table';
  END IF;
END
$$;

-- Verify the table structures
SELECT 
  table_name,
  column_name, 
  data_type, 
  is_nullable
FROM 
  information_schema.columns
WHERE 
  table_schema = 'public' 
  AND table_name IN ('counselor_applications', 'counseling_sessions')
ORDER BY 
  table_name, ordinal_position;

-- Verify RLS policies
SELECT 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual, 
  with_check
FROM 
  pg_policies
WHERE 
  tablename IN ('counselor_applications', 'counseling_sessions');
