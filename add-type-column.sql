-- Add the missing 'type' column to the counseling_sessions table
ALTER TABLE counseling_sessions ADD COLUMN type text DEFAULT 'one_on_one'::text;
