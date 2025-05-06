-- Script to update user metadata for existing counselor accounts

-- First, find all users with counselor role in user_profiles
SELECT id, display_name, role
FROM public.user_profiles
WHERE role = 'counselor';

-- Update the user metadata for all counselor accounts
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{role}',
  '"counselor"'
)
WHERE id IN (
  SELECT id FROM public.user_profiles WHERE role = 'counselor'
);

-- Find all users with admin role in user_profiles
SELECT id, display_name, role
FROM public.user_profiles
WHERE role = 'admin';

-- Update the user metadata for all admin accounts
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{role}',
  '"admin"'
)
WHERE id IN (
  SELECT id FROM public.user_profiles WHERE role = 'admin'
);

-- Verify the updates
SELECT 
  u.id, 
  u.email, 
  u.raw_user_meta_data->>'role' as metadata_role,
  p.role as profile_role
FROM 
  auth.users u
JOIN 
  public.user_profiles p ON u.id = p.id
WHERE 
  p.role IN ('counselor', 'admin');

-- Create a function to permanently set a user as a counselor
CREATE OR REPLACE FUNCTION public.set_user_as_counselor_permanent(user_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Update the user's role to counselor in both profile and metadata
  UPDATE public.user_profiles
  SET role = 'counselor',
      updated_at = NOW()
  WHERE id = user_id;
  
  -- Update the user's metadata to include the role
  UPDATE auth.users
  SET raw_user_meta_data = jsonb_set(
    COALESCE(raw_user_meta_data, '{}'::jsonb),
    '{role}',
    '"counselor"'
  )
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to permanently set a user as an admin
CREATE OR REPLACE FUNCTION public.set_user_as_admin_permanent(user_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Update the user's role to admin in both profile and metadata
  UPDATE public.user_profiles
  SET role = 'admin',
      updated_at = NOW()
  WHERE id = user_id;
  
  -- Update the user's metadata to include the role
  UPDATE auth.users
  SET raw_user_meta_data = jsonb_set(
    COALESCE(raw_user_meta_data, '{}'::jsonb),
    '{role}',
    '"admin"'
  )
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Example usage:
-- SELECT set_user_as_counselor_permanent('YOUR_COUNSELOR_USER_ID_HERE');
-- SELECT set_user_as_admin_permanent('YOUR_ADMIN_USER_ID_HERE');
