-- Function to add the type column to counseling_sessions table
CREATE OR REPLACE FUNCTION add_type_column_to_counseling_sessions()
RETURNS void AS $$
BEGIN
  -- Check if the column already exists
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'counseling_sessions'
    AND column_name = 'type'
  ) THEN
    -- Add the column if it doesn't exist
    EXECUTE 'ALTER TABLE counseling_sessions ADD COLUMN type text DEFAULT ''one_on_one''::text';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
