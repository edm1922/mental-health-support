-- Script to check the database structure

-- List all tables in the public schema
SELECT tablename FROM pg_tables WHERE schemaname = 'public';

-- List all columns in the counseling_sessions table (if it exists)
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name = 'counseling_sessions'
) AS counseling_sessions_exists;

-- If counseling_sessions exists, list its columns
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'counseling_sessions'
  ) THEN
    RAISE NOTICE 'Listing columns in counseling_sessions table:';
  ELSE
    RAISE NOTICE 'counseling_sessions table does not exist';
  END IF;
END
$$;

-- This should list all columns in the counseling_sessions table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'counseling_sessions'
ORDER BY ordinal_position;

-- Check if the counselor_applications table exists
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name = 'counselor_applications'
) AS counselor_applications_exists;

-- If counselor_applications exists, list its columns
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'counselor_applications'
  ) THEN
    RAISE NOTICE 'Listing columns in counselor_applications table:';
  ELSE
    RAISE NOTICE 'counselor_applications table does not exist';
  END IF;
END
$$;

-- This should list all columns in the counselor_applications table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'counselor_applications'
ORDER BY ordinal_position;
