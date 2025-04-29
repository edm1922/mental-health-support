-- Verify the relationship between mental_health_checkins and user_profiles

-- First, check the structure of both tables
SELECT
  table_name,
  column_name,
  data_type,
  is_nullable
FROM
  information_schema.columns
WHERE
  table_schema = 'public'
  AND table_name IN ('mental_health_checkins', 'user_profiles')
ORDER BY
  table_name, ordinal_position;

-- Check if there are any foreign key constraints between the tables
SELECT
  tc.table_schema,
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_schema AS foreign_table_schema,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM
  information_schema.table_constraints AS tc
  JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
  JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE
  tc.constraint_type = 'FOREIGN KEY'
  AND (
    (tc.table_name = 'mental_health_checkins' AND ccu.table_name = 'user_profiles')
    OR
    (tc.table_name = 'user_profiles' AND ccu.table_name = 'mental_health_checkins')
  );

-- Test query to join the tables (this is what's likely failing in the application)
SELECT
  mhc.id as checkin_id,
  mhc.mood_rating,
  mhc.notes,
  mhc.created_at,
  up.display_name,
  up.role
FROM
  mental_health_checkins mhc
JOIN
  user_profiles up ON mhc.user_id = up.id
LIMIT 5;

-- Check if there are any records in the tables
SELECT 'mental_health_checkins count' as table_name, COUNT(*) as record_count FROM mental_health_checkins
UNION ALL
SELECT 'user_profiles count' as table_name, COUNT(*) as record_count FROM user_profiles;

-- Alternative join that might be needed if the relationship is different
SELECT
  mhc.id as checkin_id,
  mhc.mood_rating,
  mhc.notes,
  mhc.created_at,
  up.display_name,
  up.role
FROM
  mental_health_checkins mhc
JOIN
  auth.users au ON mhc.user_id = au.id
JOIN
  user_profiles up ON au.id = up.id
LIMIT 5;
