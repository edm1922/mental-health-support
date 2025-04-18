-- Check and fix the structure of counseling tables

-- First, let's check the actual structure of the tables
SELECT 
  table_name,
  column_name, 
  data_type, 
  is_nullable
FROM 
  information_schema.columns
WHERE 
  table_schema = 'public' 
  AND table_name IN ('counseling_sessions', 'counselor_applications')
ORDER BY 
  table_name, ordinal_position;

-- Check if the counseling_sessions table has the expected structure
DO $$
BEGIN
  -- If the table has unexpected columns like 'column_name' and 'data_type',
  -- it might have been created incorrectly. Let's check if it has the essential columns.
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'counseling_sessions' 
    AND column_name = 'id'
  ) THEN
    RAISE NOTICE 'counseling_sessions table is missing essential columns. Consider recreating it.';
  ELSE
    RAISE NOTICE 'counseling_sessions table has the essential id column.';
  END IF;
  
  -- Check if the video call columns exist and are of the correct type
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'counseling_sessions' 
    AND column_name = 'video_enabled'
    AND data_type = 'boolean'
  ) THEN
    RAISE NOTICE 'video_enabled column exists and is of the correct type.';
  ELSE
    RAISE NOTICE 'video_enabled column is missing or has the wrong type.';
  END IF;
  
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'counseling_sessions' 
    AND column_name = 'video_room_id'
    AND data_type = 'text'
  ) THEN
    RAISE NOTICE 'video_room_id column exists and is of the correct type.';
  ELSE
    RAISE NOTICE 'video_room_id column is missing or has the wrong type.';
  END IF;
  
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'counseling_sessions' 
    AND column_name = 'video_join_url'
    AND data_type = 'text'
  ) THEN
    RAISE NOTICE 'video_join_url column exists and is of the correct type.';
  ELSE
    RAISE NOTICE 'video_join_url column is missing or has the wrong type.';
  END IF;
END
$$;

-- Check if the counselor_applications table has the expected structure
DO $$
BEGIN
  -- If the table has unexpected columns like 'column_name' and 'data_type',
  -- it might have been created incorrectly. Let's check if it has the essential columns.
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'counselor_applications' 
    AND column_name = 'id'
  ) THEN
    RAISE NOTICE 'counselor_applications table is missing essential columns. Consider recreating it.';
  ELSE
    RAISE NOTICE 'counselor_applications table has the essential id column.';
  END IF;
  
  -- Check for the user ID column (could be named user_id, userId, or something else)
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'counselor_applications' 
    AND column_name ILIKE '%user%id%'
  ) THEN
    RAISE NOTICE 'Found a user ID column in counselor_applications.';
  ELSE
    RAISE NOTICE 'Could not find a user ID column in counselor_applications.';
  END IF;
END
$$;

-- List all tables in the public schema to see what's actually there
SELECT 
  tablename 
FROM 
  pg_tables
WHERE 
  schemaname = 'public'
ORDER BY 
  tablename;

-- List all columns in the counseling_sessions table
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

-- List all columns in the counselor_applications table
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
