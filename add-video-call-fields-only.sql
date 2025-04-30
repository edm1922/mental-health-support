-- Add video call related fields to counseling_sessions table

-- First, check if the columns already exist
DO $$
BEGIN
  -- Add video_enabled column
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'counseling_sessions' 
    AND column_name = 'video_enabled'
  ) THEN
    ALTER TABLE public.counseling_sessions ADD COLUMN video_enabled BOOLEAN DEFAULT false;
    RAISE NOTICE 'Added video_enabled column';
  ELSE
    RAISE NOTICE 'video_enabled column already exists';
  END IF;

  -- Add video_room_id column
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'counseling_sessions' 
    AND column_name = 'video_room_id'
  ) THEN
    ALTER TABLE public.counseling_sessions ADD COLUMN video_room_id TEXT;
    RAISE NOTICE 'Added video_room_id column';
  ELSE
    RAISE NOTICE 'video_room_id column already exists';
  END IF;

  -- Add video_join_url column
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'counseling_sessions' 
    AND column_name = 'video_join_url'
  ) THEN
    ALTER TABLE public.counseling_sessions ADD COLUMN video_join_url TEXT;
    RAISE NOTICE 'Added video_join_url column';
  ELSE
    RAISE NOTICE 'video_join_url column already exists';
  END IF;
END
$$;

-- Verify the table structure
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
