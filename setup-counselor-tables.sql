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

-- Create policy for users to read their own applications
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_policies 
    WHERE tablename = 'counselor_applications' 
    AND policyname = 'Users can read their own applications'
  ) THEN
    CREATE POLICY "Users can read their own applications"
      ON public.counselor_applications
      FOR SELECT
      USING (auth.uid() = user_id);
    
    RAISE NOTICE 'Created policy: Users can read their own applications';
  END IF;
END
$$;

-- Create policy for users to insert their own applications
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_policies 
    WHERE tablename = 'counselor_applications' 
    AND policyname = 'Users can insert their own applications'
  ) THEN
    CREATE POLICY "Users can insert their own applications"
      ON public.counselor_applications
      FOR INSERT
      WITH CHECK (auth.uid() = user_id);
    
    RAISE NOTICE 'Created policy: Users can insert their own applications';
  END IF;
END
$$;

-- Create policy for admins to read all applications (you'll need to define who admins are)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_policies 
    WHERE tablename = 'counselor_applications' 
    AND policyname = 'Admins can read all applications'
  ) THEN
    CREATE POLICY "Admins can read all applications"
      ON public.counselor_applications
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.user_profiles
          WHERE id = auth.uid() AND role = 'admin'
        )
      );
    
    RAISE NOTICE 'Created policy: Admins can read all applications';
  END IF;
END
$$;

-- Create policy for admins to update applications
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_policies 
    WHERE tablename = 'counselor_applications' 
    AND policyname = 'Admins can update applications'
  ) THEN
    CREATE POLICY "Admins can update applications"
      ON public.counselor_applications
      FOR UPDATE
      USING (
        EXISTS (
          SELECT 1 FROM public.user_profiles
          WHERE id = auth.uid() AND role = 'admin'
        )
      );
    
    RAISE NOTICE 'Created policy: Admins can update applications';
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
