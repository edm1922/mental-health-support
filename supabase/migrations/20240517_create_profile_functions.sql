-- Function to check if a profile exists
CREATE OR REPLACE FUNCTION profile_exists(user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (SELECT COUNT(*) FROM user_profiles WHERE id = user_id);
END;
$$;

-- Function to update a user profile
CREATE OR REPLACE FUNCTION update_user_profile(
  user_id UUID,
  display_name_param TEXT,
  bio_param TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE user_profiles
  SET 
    display_name = display_name_param,
    bio = bio_param,
    updated_at = NOW()
  WHERE id = user_id;
  
  RETURN FOUND;
END;
$$;

-- Function to create a user profile
CREATE OR REPLACE FUNCTION create_user_profile(
  user_id UUID,
  display_name_param TEXT,
  bio_param TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO user_profiles (
    id,
    display_name,
    bio,
    role,
    created_at,
    updated_at
  ) VALUES (
    user_id,
    display_name_param,
    bio_param,
    'user',
    NOW(),
    NOW()
  );
  
  RETURN TRUE;
EXCEPTION
  WHEN unique_violation THEN
    RETURN FALSE;
END;
$$;
