-- Test script to work with the existing table structure

-- Insert a test record using the actual column structure
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
  'test-room-123',
  'https://example.com/video/test-room-123'
)
RETURNING id;

-- Select records with video enabled
SELECT 
  id,
  column_name AS session_name,
  data_type AS session_type,
  video_enabled,
  video_room_id,
  video_join_url
FROM 
  public.counseling_sessions
WHERE 
  video_enabled = TRUE;
