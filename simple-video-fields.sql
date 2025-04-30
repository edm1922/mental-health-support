-- Simple script to add video call fields only

-- First, let's check what tables exist
SELECT tablename FROM pg_tables WHERE schemaname = 'public';

-- Add video call fields to counseling_sessions table
ALTER TABLE public.counseling_sessions 
ADD COLUMN IF NOT EXISTS video_enabled BOOLEAN DEFAULT false;

ALTER TABLE public.counseling_sessions 
ADD COLUMN IF NOT EXISTS video_room_id TEXT;

ALTER TABLE public.counseling_sessions 
ADD COLUMN IF NOT EXISTS video_join_url TEXT;

-- Check if the columns were added
SELECT column_name 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'counseling_sessions' 
AND column_name IN ('video_enabled', 'video_room_id', 'video_join_url');
