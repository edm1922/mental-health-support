-- Insert a record with all required fields

INSERT INTO public.counseling_sessions (
  column_name,  -- This is a required field
  data_type,    -- This might be required too
  video_enabled,
  video_room_id,
  video_join_url
) VALUES (
  'Test Session',  -- Providing a value for column_name
  'counseling',    -- Providing a value for data_type
  TRUE,
  'test-room-with-required',
  'https://example.com/video/test-room-with-required'
);

-- Select all records to see if the insert worked
SELECT * FROM public.counseling_sessions;
