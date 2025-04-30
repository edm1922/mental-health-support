-- Try to add a foreign key constraint between mental_health_checkins and user_profiles if possible

-- First, check if there are any records in mental_health_checkins that don't have a matching user_id in user_profiles
DO $$
DECLARE
  invalid_count INTEGER;
BEGIN
  -- Count records that don't have a matching user_id
  SELECT COUNT(*) INTO invalid_count
  FROM mental_health_checkins mhc
  LEFT JOIN user_profiles up ON mhc.user_id = up.id
  WHERE up.id IS NULL;
  
  -- If there are no invalid records, try to add the foreign key constraint
  IF invalid_count = 0 THEN
    -- Check if the constraint already exists
    IF NOT EXISTS (
      SELECT FROM information_schema.table_constraints tc
      JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'public'
      AND tc.table_name = 'mental_health_checkins'
      AND ccu.table_name = 'user_profiles'
      AND ccu.column_name = 'id'
    ) THEN
      -- Add the foreign key constraint
      ALTER TABLE mental_health_checkins
      ADD CONSTRAINT mental_health_checkins_user_profiles_fkey
      FOREIGN KEY (user_id)
      REFERENCES user_profiles(id);
      
      RAISE NOTICE 'Added foreign key constraint between mental_health_checkins and user_profiles';
    ELSE
      RAISE NOTICE 'Foreign key constraint already exists';
    END IF;
  ELSE
    RAISE NOTICE 'Cannot add foreign key constraint: % records in mental_health_checkins do not have matching user_profiles', invalid_count;
  END IF;
END
$$;
