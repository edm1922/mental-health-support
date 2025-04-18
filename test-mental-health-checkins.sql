-- Test script for mental_health_checkins table

-- First, let's check if the table exists and has the right structure
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

-- Insert a test record (replace 'your-user-id' with your actual user ID)
INSERT INTO public.mental_health_checkins (
  user_id,
  mood_rating,
  notes
) VALUES (
  auth.uid()::text,  -- This will use the current authenticated user's ID
  3,                 -- Neutral mood
  'Test note from SQL editor'
)
RETURNING *;

-- Query the most recent check-ins for the current user
SELECT 
  id,
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
