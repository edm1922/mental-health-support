-- Alternative script to check database structure

-- List all tables in the database
SELECT table_schema, table_name 
FROM information_schema.tables 
WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
ORDER BY table_schema, table_name;

-- Try to select a single row from the counseling_sessions table
SELECT * FROM public.counseling_sessions LIMIT 1;

-- Check if the video call columns exist using a different method
SELECT EXISTS (
  SELECT 1
  FROM information_schema.columns
  WHERE table_schema = 'public'
  AND table_name = 'counseling_sessions'
  AND column_name = 'video_enabled'
) AS video_enabled_exists,
EXISTS (
  SELECT 1
  FROM information_schema.columns
  WHERE table_schema = 'public'
  AND table_name = 'counseling_sessions'
  AND column_name = 'video_room_id'
) AS video_room_id_exists,
EXISTS (
  SELECT 1
  FROM information_schema.columns
  WHERE table_schema = 'public'
  AND table_name = 'counseling_sessions'
  AND column_name = 'video_join_url'
) AS video_join_url_exists;

-- Try to count the number of columns in the counseling_sessions table
SELECT COUNT(*) AS column_count
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'counseling_sessions';

-- Try to get the primary key column of the counseling_sessions table
SELECT kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_schema = 'public'
AND tc.table_name = 'counseling_sessions'
AND tc.constraint_type = 'PRIMARY KEY';
