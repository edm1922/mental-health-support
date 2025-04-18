-- Add video call related fields to counseling_sessions table

-- Add video_enabled column if it doesn't exist
ALTER TABLE public.counseling_sessions 
ADD COLUMN IF NOT EXISTS video_enabled BOOLEAN DEFAULT false;

-- Add video_room_id column if it doesn't exist
ALTER TABLE public.counseling_sessions 
ADD COLUMN IF NOT EXISTS video_room_id TEXT;

-- Add video_join_url column if it doesn't exist
ALTER TABLE public.counseling_sessions 
ADD COLUMN IF NOT EXISTS video_join_url TEXT;

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
