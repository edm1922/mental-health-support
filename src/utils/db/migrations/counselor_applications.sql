-- Check if the counselor_applications table exists
CREATE TABLE IF NOT EXISTS counselor_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  credentials TEXT NOT NULL,
  specialization TEXT,
  experience TEXT,
  availability TEXT,
  motivation TEXT,
  referral TEXT,
  license_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS counselor_applications_user_id_idx ON counselor_applications(user_id);

-- Create index on status for filtering
CREATE INDEX IF NOT EXISTS counselor_applications_status_idx ON counselor_applications(status);

-- Add RLS policies
ALTER TABLE counselor_applications ENABLE ROW LEVEL SECURITY;

-- Policy for users to view their own applications
CREATE POLICY view_own_applications ON counselor_applications 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Policy for users to insert their own applications
CREATE POLICY insert_own_applications ON counselor_applications 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Policy for admins to view all applications
CREATE POLICY admin_view_all_applications ON counselor_applications 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.id = auth.uid() 
      AND user_profiles.role = 'admin'
    )
  );

-- Policy for admins to update applications
CREATE POLICY admin_update_applications ON counselor_applications 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.id = auth.uid() 
      AND user_profiles.role = 'admin'
    )
  );
