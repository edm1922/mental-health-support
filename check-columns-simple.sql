-- Simple script to check what columns actually exist

-- Try to select all columns from the table
SELECT * FROM public.counseling_sessions LIMIT 1;

-- Try to insert a record with just the video fields
INSERT INTO public.counseling_sessions (
  video_enabled,
  video_room_id,
  video_join_url
) VALUES (
  TRUE,
  'test-room-simple',
  'https://example.com/video/test-room-simple'
);
