-- Check the actual column names in the counseling_sessions table

-- List all columns in the counseling_sessions table
SELECT column_name
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'counseling_sessions'
ORDER BY ordinal_position;
