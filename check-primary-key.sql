-- Check the primary key of the counseling_sessions table

-- Check for primary key constraints
SELECT 
  tc.constraint_name, 
  kcu.column_name
FROM 
  information_schema.table_constraints tc
JOIN 
  information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
WHERE 
  tc.table_schema = 'public'
  AND tc.table_name = 'counseling_sessions'
  AND tc.constraint_type = 'PRIMARY KEY';

-- Check for unique constraints
SELECT 
  tc.constraint_name, 
  kcu.column_name
FROM 
  information_schema.table_constraints tc
JOIN 
  information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
WHERE 
  tc.table_schema = 'public'
  AND tc.table_name = 'counseling_sessions'
  AND tc.constraint_type = 'UNIQUE';

-- Check for identity columns
SELECT 
  column_name
FROM 
  information_schema.columns
WHERE 
  table_schema = 'public'
  AND table_name = 'counseling_sessions'
  AND is_identity = 'YES';

-- Try to describe the table structure
\d public.counseling_sessions
