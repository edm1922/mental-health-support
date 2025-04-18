-- Drop the existing counseling_sessions table
DROP TABLE IF EXISTS public.counseling_sessions;

-- Create a properly structured counseling_sessions table
CREATE TABLE public.counseling_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  counselor_id UUID NOT NULL,
  patient_id UUID NOT NULL,
  session_date TIMESTAMP WITH TIME ZONE NOT NULL,
  duration INTEGER DEFAULT 60,
  status TEXT DEFAULT 'scheduled',
  notes TEXT,
  video_enabled BOOLEAN DEFAULT false,
  video_room_id TEXT,
  video_join_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS counseling_sessions_counselor_id_idx ON public.counseling_sessions(counselor_id);
CREATE INDEX IF NOT EXISTS counseling_sessions_patient_id_idx ON public.counseling_sessions(patient_id);

-- Verify the structure of the new table
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
