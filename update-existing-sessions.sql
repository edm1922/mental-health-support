-- Update existing counseling sessions with video call information

-- First, let's see what sessions we have
SELECT * FROM public.counseling_sessions;

-- Update a specific session (replace 'id' with the actual session identifier)
UPDATE public.counseling_sessions
SET 
  video_enabled = TRUE,
  video_room_id = 'room-' || column_name,
  video_join_url = 'https://example.com/video/room-' || column_name
WHERE 
  column_name = 'id';  -- Replace 'id' with the session you want to update

-- Check if the update worked
SELECT * FROM public.counseling_sessions 
WHERE video_enabled = TRUE;
