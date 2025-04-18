-- Simple script to check and fix video call functionality

-- First, let's list all tables in the public schema
SELECT 
  tablename 
FROM 
  pg_tables
WHERE 
  schemaname = 'public'
ORDER BY 
  tablename;

-- Now, let's check if the counseling_sessions table exists and create it if needed
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'counseling_sessions'
  ) THEN
    -- Create the counseling_sessions table
    CREATE TABLE public.counseling_sessions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      counselor_id UUID REFERENCES auth.users(id),
      client_id UUID REFERENCES auth.users(id),
      session_date TIMESTAMP WITH TIME ZONE NOT NULL,
      duration INTEGER DEFAULT 60,
      status TEXT DEFAULT 'scheduled',
      notes TEXT,
      video_enabled BOOLEAN DEFAULT false,
      video_room_id TEXT,
      video_join_url TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    RAISE NOTICE 'Created counseling_sessions table';
  ELSE
    -- Table exists, check if it has the video call columns
    IF NOT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'counseling_sessions' 
      AND column_name = 'video_enabled'
    ) THEN
      ALTER TABLE public.counseling_sessions ADD COLUMN video_enabled BOOLEAN DEFAULT false;
      RAISE NOTICE 'Added video_enabled column';
    END IF;
    
    IF NOT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'counseling_sessions' 
      AND column_name = 'video_room_id'
    ) THEN
      ALTER TABLE public.counseling_sessions ADD COLUMN video_room_id TEXT;
      RAISE NOTICE 'Added video_room_id column';
    END IF;
    
    IF NOT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'counseling_sessions' 
      AND column_name = 'video_join_url'
    ) THEN
      ALTER TABLE public.counseling_sessions ADD COLUMN video_join_url TEXT;
      RAISE NOTICE 'Added video_join_url column';
    END IF;
    
    RAISE NOTICE 'Updated counseling_sessions table';
  END IF;
END
$$;

-- Now, let's check if the counselor_applications table exists and create it if needed
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
      user_id UUID REFERENCES auth.users(id),
      credentials TEXT NOT NULL,
      years_experience INTEGER NOT NULL,
      specializations TEXT NOT NULL,
      summary TEXT NOT NULL,
      phone TEXT,
      license_url TEXT,
      status TEXT DEFAULT 'pending',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    RAISE NOTICE 'Created counselor_applications table';
  ELSE
    RAISE NOTICE 'counselor_applications table already exists';
  END IF;
END
$$;

-- Let's verify the structure of the counseling_sessions table
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM 
  information_schema.columns
WHERE 
  table_schema = 'public' 
  AND table_name = 'counseling_sessions'
ORDER BY 
  ordinal_position;

-- Let's verify the structure of the counselor_applications table
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM 
  information_schema.columns
WHERE 
  table_schema = 'public' 
  AND table_name = 'counselor_applications'
ORDER BY 
  ordinal_position;
