-- Script to recreate the counselor_applications table and add video call fields

-- First, drop the existing counselor_applications table if it exists
DROP TABLE IF EXISTS public.counselor_applications;

-- Create a properly structured counselor_applications table
CREATE TABLE public.counselor_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  credentials TEXT NOT NULL,
  years_experience INTEGER NOT NULL,
  specializations TEXT NOT NULL,
  summary TEXT NOT NULL,
  phone TEXT,
  license_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add video call fields to the counseling_sessions table
-- These should work with your existing table structure
ALTER TABLE public.counseling_sessions 
ADD COLUMN IF NOT EXISTS video_enabled BOOLEAN DEFAULT false;

ALTER TABLE public.counseling_sessions 
ADD COLUMN IF NOT EXISTS video_room_id TEXT;

ALTER TABLE public.counseling_sessions 
ADD COLUMN IF NOT EXISTS video_join_url TEXT;

-- Verify the structure of the new counselor_applications table
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM 
  information_schema.columns
WHERE 
  table_schema = 'public' 
  AND table_name = 'counselor_applications'
ORDER BY 
  ordinal_position;

-- Verify that the video call fields exist in the counseling_sessions table
SELECT 
  column_name
FROM 
  information_schema.columns
WHERE 
  table_schema = 'public' 
  AND table_name = 'counseling_sessions'
  AND column_name IN ('video_enabled', 'video_room_id', 'video_join_url');
