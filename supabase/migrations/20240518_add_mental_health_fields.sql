-- Add mental health related fields to user_profiles table
ALTER TABLE user_profiles 
  ADD COLUMN IF NOT EXISTS mental_health_interests TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS support_preferences TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS comfort_level_sharing TEXT DEFAULT 'moderate',
  ADD COLUMN IF NOT EXISTS preferred_contact_method TEXT DEFAULT 'app',
  ADD COLUMN IF NOT EXISTS emergency_contact TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS goals TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS preferred_resources TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS triggers TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS coping_strategies TEXT[] DEFAULT '{}';
