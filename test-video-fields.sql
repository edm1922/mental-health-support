-- Test script to verify video call fields are working

-- First, let's check if we can insert data with the video call fields
DO $$
DECLARE
  test_session_id UUID;
BEGIN
  -- Create a test counseling session with video call fields
  INSERT INTO public.counseling_sessions (
    counselor_id,
    client_id,
    session_date,
    duration,
    status,
    notes,
    video_enabled,
    video_room_id,
    video_join_url
  ) VALUES (
    '00000000-0000-0000-0000-000000000000', -- placeholder UUID, replace with actual counselor ID if needed
    '00000000-0000-0000-0000-000000000001', -- placeholder UUID, replace with actual client ID if needed
    NOW() + INTERVAL '1 day',
    60,
    'scheduled',
    'Test session for video call',
    TRUE,
    'test-room-id',
    'https://example.com/test-video-room'
  )
  RETURNING id INTO test_session_id;
  
  RAISE NOTICE 'Created test session with ID: %', test_session_id;
  
  -- Now retrieve the session to verify the video call fields
  RAISE NOTICE 'Retrieving test session data:';
END
$$;

-- Try to select data from the counseling_sessions table
SELECT 
  id,
  video_enabled,
  video_room_id,
  video_join_url
FROM 
  public.counseling_sessions
WHERE 
  notes = 'Test session for video call'
LIMIT 1;

-- If the above query works, the video call fields are functioning correctly
-- If it fails, we'll need to investigate further
