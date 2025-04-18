-- Check the structure of the counseling_sessions table

-- List all columns in the table
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM 
  information_schema.columns
WHERE 
  table_schema = 'public' 
  AND table_name = 'counseling_sessions'
ORDER BY 
  ordinal_position;

-- Try to insert a record with all fields
INSERT INTO public.counseling_sessions (
  column_name,
  data_type,
  video_enabled,
  video_room_id,
  video_join_url
) VALUES (
  'Test Session',
  'counseling',
  TRUE,
  'test-room-complete',
  'https://example.com/video/test-room-complete'
);

-- Select all records to see the structure
SELECT * FROM public.counseling_sessions;
