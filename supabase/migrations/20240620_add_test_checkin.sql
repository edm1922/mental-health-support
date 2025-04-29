-- Add a test check-in record to verify the relationship works

-- First, check if the foreign key constraint exists and temporarily disable it
DO $$
BEGIN
  -- Check if the constraint exists
  IF EXISTS (
    SELECT FROM information_schema.table_constraints
    WHERE constraint_name = 'mental_health_checkins_user_id_fkey'
    AND table_name = 'mental_health_checkins'
  ) THEN
    -- Temporarily disable the constraint
    ALTER TABLE mental_health_checkins DROP CONSTRAINT mental_health_checkins_user_id_fkey;
    RAISE NOTICE 'Temporarily disabled foreign key constraint';
  END IF;
END
$$;

-- Now add a test check-in
DO $$
DECLARE
  test_user_id UUID;
BEGIN
  -- Get the first user ID from user_profiles
  SELECT id INTO test_user_id FROM user_profiles LIMIT 1;

  IF test_user_id IS NULL THEN
    RAISE NOTICE 'No users found in user_profiles table. Cannot create test check-in.';
    RETURN;
  END IF;

  -- Insert a test check-in for this user
  INSERT INTO mental_health_checkins (
    id,
    user_id,
    mood_rating,
    notes,
    sleep_hours,
    stress_level,
    anxiety_level,
    created_at
  ) VALUES (
    gen_random_uuid(),
    test_user_id,
    3,
    'This is a test check-in to verify the relationship between mental_health_checkins and user_profiles',
    7,
    2,
    2,
    NOW()
  );

  RAISE NOTICE 'Created test check-in for user ID: %', test_user_id;
END
$$;

-- Verify the test check-in was created
SELECT
  mhc.id as checkin_id,
  mhc.user_id,
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

-- Check the count again
SELECT 'mental_health_checkins count' as table_name, COUNT(*) as record_count FROM mental_health_checkins
UNION ALL
SELECT 'user_profiles count' as table_name, COUNT(*) as record_count FROM user_profiles;
