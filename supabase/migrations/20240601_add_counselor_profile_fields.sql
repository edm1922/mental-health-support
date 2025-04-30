-- Add counselor-specific fields to user_profiles table
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS specializations TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS years_experience INTEGER,
  ADD COLUMN IF NOT EXISTS credentials TEXT,
  ADD COLUMN IF NOT EXISTS availability_hours TEXT,
  ADD COLUMN IF NOT EXISTS professional_bio TEXT;

-- Create a function to ensure counselor fields are properly initialized
CREATE OR REPLACE FUNCTION public.ensure_counselor_fields()
RETURNS TRIGGER AS $$
BEGIN
  -- If the user is a counselor, initialize the counselor-specific fields
  IF NEW.role = 'counselor' THEN
    -- Only set default values if the fields are null
    NEW.specializations := COALESCE(NEW.specializations, '{}');
    NEW.credentials := COALESCE(NEW.credentials, 'Counselor');
    NEW.professional_bio := COALESCE(NEW.professional_bio, 'Professional counselor');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to automatically initialize counselor fields
DROP TRIGGER IF EXISTS ensure_counselor_fields_trigger ON public.user_profiles;
CREATE TRIGGER ensure_counselor_fields_trigger
BEFORE INSERT OR UPDATE OF role ON public.user_profiles
FOR EACH ROW
EXECUTE FUNCTION public.ensure_counselor_fields();

-- Create a function to update a user's role to counselor
CREATE OR REPLACE FUNCTION public.set_user_as_counselor(user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.user_profiles
  SET role = 'counselor',
      updated_at = NOW()
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to get counselor profile data
CREATE OR REPLACE FUNCTION public.get_counselor_profile(counselor_id UUID)
RETURNS TABLE (
  id UUID,
  display_name TEXT,
  bio TEXT,
  specializations TEXT[],
  years_experience INTEGER,
  credentials TEXT,
  availability_hours TEXT,
  professional_bio TEXT,
  preferred_contact_method TEXT,
  role TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.display_name,
    p.bio,
    p.specializations,
    p.years_experience,
    p.credentials,
    p.availability_hours,
    p.professional_bio,
    p.preferred_contact_method,
    p.role,
    p.created_at,
    p.updated_at
  FROM
    public.user_profiles p
  WHERE
    p.id = counselor_id AND
    p.role = 'counselor';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to list all counselor profiles
CREATE OR REPLACE FUNCTION public.list_counselor_profiles()
RETURNS TABLE (
  id UUID,
  display_name TEXT,
  bio TEXT,
  specializations TEXT[],
  years_experience INTEGER,
  credentials TEXT,
  availability_hours TEXT,
  professional_bio TEXT,
  preferred_contact_method TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.display_name,
    p.bio,
    p.specializations,
    p.years_experience,
    p.credentials,
    p.availability_hours,
    p.professional_bio,
    p.preferred_contact_method,
    p.created_at,
    p.updated_at
  FROM
    public.user_profiles p
  WHERE
    p.role = 'counselor';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
