-- Fix the relationship between mental_health_checkins and user_profiles tables

-- First, check if there's already a foreign key constraint between the tables
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.table_constraints tc
    JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
    AND tc.table_name = 'mental_health_checkins'
    AND ccu.table_name = 'user_profiles'
    AND ccu.column_name = 'id'
  ) THEN
    -- Add an index on user_profiles.id if it doesn't exist
    IF NOT EXISTS (
      SELECT FROM pg_indexes
      WHERE tablename = 'user_profiles'
      AND indexname = 'user_profiles_id_idx'
    ) THEN
      CREATE INDEX IF NOT EXISTS user_profiles_id_idx ON user_profiles(id);
      RAISE NOTICE 'Created index on user_profiles.id';
    END IF;
    
    -- Add an index on mental_health_checkins.user_id if it doesn't exist
    IF NOT EXISTS (
      SELECT FROM pg_indexes
      WHERE tablename = 'mental_health_checkins'
      AND indexname = 'mental_health_checkins_user_id_idx'
    ) THEN
      CREATE INDEX IF NOT EXISTS mental_health_checkins_user_id_idx ON mental_health_checkins(user_id);
      RAISE NOTICE 'Created index on mental_health_checkins.user_id';
    END IF;
    
    -- Create a view that joins the tables to help with the relationship
    CREATE OR REPLACE VIEW mental_health_checkins_with_users AS
    SELECT
      mhc.*,
      up.display_name,
      up.role
    FROM
      mental_health_checkins mhc
    JOIN
      user_profiles up ON mhc.user_id = up.id;
    
    RAISE NOTICE 'Created view mental_health_checkins_with_users';
  ELSE
    RAISE NOTICE 'Foreign key constraint already exists between mental_health_checkins and user_profiles';
  END IF;
END
$$;

-- Verify the relationship by querying the view
SELECT * FROM mental_health_checkins_with_users LIMIT 5;
