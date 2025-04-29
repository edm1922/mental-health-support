-- Updated test script for mental_health_checkins table

-- First, let's check the current structure of the table
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM 
  information_schema.columns
WHERE 
  table_schema = 'public' 
  AND table_name = 'mental_health_checkins'
ORDER BY 
  ordinal_position;

-- Insert a test record using only the columns we know exist
INSERT INTO public.mental_health_checkins (
  user_id,
  mood_rating,
  notes
) VALUES (
  auth.uid()::text,  -- This will use the current authenticated user's ID
  4,                 -- Happy mood
  'Test note after fixing the table structure'
)
RETURNING *;

-- Query the most recent check-ins for the current user
-- Only select columns we know exist
SELECT 
  user_id,
  mood_rating,
  notes,
  created_at
FROM 
  public.mental_health_checkins
WHERE 
  user_id = auth.uid()::text
ORDER BY 
  created_at DESC
LIMIT 10;
