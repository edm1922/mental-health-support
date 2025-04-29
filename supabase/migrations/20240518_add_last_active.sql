-- Add last_active column to user_profiles table
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS last_active TIMESTAMPTZ DEFAULT NOW();

-- Update existing profiles to have a last_active value
UPDATE user_profiles SET last_active = updated_at WHERE last_active IS NULL;
