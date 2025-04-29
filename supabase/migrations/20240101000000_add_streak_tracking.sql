-- Create a table to track user streaks
CREATE TABLE IF NOT EXISTS user_streaks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  current_streak INT NOT NULL DEFAULT 0,
  longest_streak INT NOT NULL DEFAULT 0,
  last_check_in TIMESTAMP WITH TIME ZONE,
  streak_start_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create an index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS user_streaks_user_id_idx ON user_streaks(user_id);

-- Add a unique constraint on user_id
DO $$
BEGIN
  BEGIN
    ALTER TABLE user_streaks ADD CONSTRAINT user_streaks_user_id_key UNIQUE (user_id);
  EXCEPTION WHEN duplicate_object THEN
    -- Constraint already exists
  END;
END $$;

-- Create RLS policies for the user_streaks table
ALTER TABLE user_streaks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$
BEGIN
  -- Drop policies if they exist
  BEGIN
    DROP POLICY IF EXISTS user_streaks_select_policy ON user_streaks;
  EXCEPTION WHEN OTHERS THEN
    -- Policy doesn't exist, ignore
  END;

  BEGIN
    DROP POLICY IF EXISTS user_streaks_update_policy ON user_streaks;
  EXCEPTION WHEN OTHERS THEN
    -- Policy doesn't exist, ignore
  END;

  BEGIN
    DROP POLICY IF EXISTS user_streaks_insert_policy ON user_streaks;
  EXCEPTION WHEN OTHERS THEN
    -- Policy doesn't exist, ignore
  END;
END $$;

-- Policy to allow users to view only their own streak data
CREATE POLICY user_streaks_select_policy ON user_streaks
  FOR SELECT USING (auth.uid() = user_id);

-- Policy to allow users to update only their own streak data
CREATE POLICY user_streaks_update_policy ON user_streaks
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy to allow users to insert their own streak data
CREATE POLICY user_streaks_insert_policy ON user_streaks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Function to update streak when a new check-in is created
CREATE OR REPLACE FUNCTION update_user_streak()
RETURNS TRIGGER AS $$
DECLARE
  streak_record RECORD;
  last_check_in_date DATE;
  checkin_date DATE;
BEGIN
  -- Get the current user's streak record
  SELECT * INTO streak_record FROM user_streaks WHERE user_id = NEW.user_id;

  -- If no streak record exists, create one
  IF streak_record IS NULL THEN
    INSERT INTO user_streaks (user_id, current_streak, longest_streak, last_check_in, streak_start_date)
    VALUES (NEW.user_id, 1, 1, NEW.created_at, NEW.created_at);
    RETURN NEW;
  END IF;

  -- Calculate dates for comparison
  last_check_in_date := DATE(streak_record.last_check_in AT TIME ZONE 'UTC');
  checkin_date := DATE(NEW.created_at AT TIME ZONE 'UTC');

  -- Update streak based on date difference
  IF checkin_date = last_check_in_date THEN
    -- Already checked in today, no streak change
    NULL;
  ELSIF checkin_date = last_check_in_date + INTERVAL '1 day' THEN
    -- Consecutive day, increment streak
    UPDATE user_streaks
    SET
      current_streak = current_streak + 1,
      longest_streak = GREATEST(longest_streak, current_streak + 1),
      last_check_in = NEW.created_at,
      updated_at = now()
    WHERE user_id = NEW.user_id;
  ELSIF checkin_date > last_check_in_date + INTERVAL '1 day' THEN
    -- Streak broken, reset to 1
    UPDATE user_streaks
    SET
      current_streak = 1,
      last_check_in = NEW.created_at,
      streak_start_date = NEW.created_at,
      updated_at = now()
    WHERE user_id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to update streak on new check-in
DROP TRIGGER IF EXISTS update_streak_on_checkin ON mental_health_checkins;
CREATE TRIGGER update_streak_on_checkin
AFTER INSERT ON mental_health_checkins
FOR EACH ROW
EXECUTE FUNCTION update_user_streak();

-- Function to initialize user streak on user creation
CREATE OR REPLACE FUNCTION initialize_user_streak()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_streaks (user_id, current_streak, longest_streak)
  VALUES (NEW.id, 0, 0);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to initialize streak on new user
DROP TRIGGER IF EXISTS initialize_streak_on_user_creation ON auth.users;
CREATE TRIGGER initialize_streak_on_user_creation
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION initialize_user_streak();

-- Initialize streaks for existing users
INSERT INTO user_streaks (user_id, current_streak, longest_streak)
SELECT id, 0, 0 FROM auth.users
WHERE id NOT IN (SELECT user_id FROM user_streaks)
ON CONFLICT (user_id) DO NOTHING;

-- Function to reset streaks for users who haven't checked in for more than a day
CREATE OR REPLACE FUNCTION reset_stale_streaks()
RETURNS void AS $$
BEGIN
  UPDATE user_streaks
  SET
    current_streak = 0,
    updated_at = now()
  WHERE
    last_check_in IS NOT NULL AND
    DATE(last_check_in AT TIME ZONE 'UTC') < (DATE(now() AT TIME ZONE 'UTC') - INTERVAL '1 day');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a cron job to run the reset function daily (if using pg_cron extension)
-- Uncomment if you have pg_cron installed
-- SELECT cron.schedule('0 0 * * *', 'SELECT reset_stale_streaks()');
