-- Simple script to add counselor-specific fields to user_profiles table
-- This can be run directly in the Supabase SQL editor

-- Add counselor-specific fields to user_profiles table
ALTER TABLE public.user_profiles 
  ADD COLUMN IF NOT EXISTS specializations TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS years_experience INTEGER,
  ADD COLUMN IF NOT EXISTS credentials TEXT,
  ADD COLUMN IF NOT EXISTS availability_hours TEXT,
  ADD COLUMN IF NOT EXISTS professional_bio TEXT;

-- Update any existing counselor profiles to initialize fields
UPDATE public.user_profiles
SET 
  specializations = COALESCE(specializations, '{}'),
  credentials = COALESCE(credentials, 'Counselor'),
  professional_bio = COALESCE(professional_bio, 'Professional counselor')
WHERE 
  role = 'counselor';

-- Comment on the new columns
COMMENT ON COLUMN public.user_profiles.specializations IS 'Areas of expertise for counselors';
COMMENT ON COLUMN public.user_profiles.years_experience IS 'Years of professional experience as a counselor';
COMMENT ON COLUMN public.user_profiles.credentials IS 'Professional credentials and certifications';
COMMENT ON COLUMN public.user_profiles.availability_hours IS 'When the counselor is available for sessions';
COMMENT ON COLUMN public.user_profiles.professional_bio IS 'Detailed professional background and approach to counseling';
