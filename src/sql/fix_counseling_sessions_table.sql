-- Fix the counseling_sessions table structure
DO $$
DECLARE
  has_patient_id BOOLEAN;
  has_client_id BOOLEAN;
  has_counselor_id BOOLEAN;
  has_scheduled_for BOOLEAN;
  has_session_date BOOLEAN;
BEGIN
  -- Check which columns exist
  SELECT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'counseling_sessions'
    AND column_name = 'patient_id'
  ) INTO has_patient_id;
  
  SELECT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'counseling_sessions'
    AND column_name = 'client_id'
  ) INTO has_client_id;
  
  SELECT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'counseling_sessions'
    AND column_name = 'counselor_id'
  ) INTO has_counselor_id;
  
  SELECT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'counseling_sessions'
    AND column_name = 'scheduled_for'
  ) INTO has_scheduled_for;
  
  SELECT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'counseling_sessions'
    AND column_name = 'session_date'
  ) INTO has_session_date;
  
  -- If the table doesn't have patient_id but has client_id, add patient_id
  IF NOT has_patient_id AND has_client_id THEN
    EXECUTE 'ALTER TABLE public.counseling_sessions ADD COLUMN patient_id UUID';
    EXECUTE 'UPDATE public.counseling_sessions SET patient_id = client_id';
  END IF;
  
  -- If the table doesn't have client_id but has patient_id, add client_id
  IF NOT has_client_id AND has_patient_id THEN
    EXECUTE 'ALTER TABLE public.counseling_sessions ADD COLUMN client_id UUID';
    EXECUTE 'UPDATE public.counseling_sessions SET client_id = patient_id';
  END IF;
  
  -- If the table doesn't have counselor_id, add it
  IF NOT has_counselor_id THEN
    EXECUTE 'ALTER TABLE public.counseling_sessions ADD COLUMN counselor_id UUID';
  END IF;
  
  -- If the table doesn't have session_date but has scheduled_for, add session_date
  IF NOT has_session_date AND has_scheduled_for THEN
    EXECUTE 'ALTER TABLE public.counseling_sessions ADD COLUMN session_date TIMESTAMP WITH TIME ZONE';
    EXECUTE 'UPDATE public.counseling_sessions SET session_date = scheduled_for';
  END IF;
  
  -- If the table doesn't have scheduled_for but has session_date, add scheduled_for
  IF NOT has_scheduled_for AND has_session_date THEN
    EXECUTE 'ALTER TABLE public.counseling_sessions ADD COLUMN scheduled_for TIMESTAMP WITH TIME ZONE';
    EXECUTE 'UPDATE public.counseling_sessions SET scheduled_for = session_date';
  END IF;
  
  -- Make sure all required columns exist
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'counseling_sessions'
    AND column_name = 'video_enabled'
  ) THEN
    EXECUTE 'ALTER TABLE public.counseling_sessions ADD COLUMN video_enabled BOOLEAN DEFAULT false';
  END IF;
  
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'counseling_sessions'
    AND column_name = 'video_room_id'
  ) THEN
    EXECUTE 'ALTER TABLE public.counseling_sessions ADD COLUMN video_room_id TEXT';
  END IF;
  
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'counseling_sessions'
    AND column_name = 'video_join_url'
  ) THEN
    EXECUTE 'ALTER TABLE public.counseling_sessions ADD COLUMN video_join_url TEXT';
  END IF;
  
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'counseling_sessions'
    AND column_name = 'duration'
  ) THEN
    EXECUTE 'ALTER TABLE public.counseling_sessions ADD COLUMN duration INTEGER DEFAULT 60';
  END IF;
  
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'counseling_sessions'
    AND column_name = 'status'
  ) THEN
    EXECUTE 'ALTER TABLE public.counseling_sessions ADD COLUMN status TEXT DEFAULT ''scheduled''';
  END IF;
  
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'counseling_sessions'
    AND column_name = 'notes'
  ) THEN
    EXECUTE 'ALTER TABLE public.counseling_sessions ADD COLUMN notes TEXT';
  END IF;
  
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'counseling_sessions'
    AND column_name = 'created_at'
  ) THEN
    EXECUTE 'ALTER TABLE public.counseling_sessions ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()';
  END IF;
  
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'counseling_sessions'
    AND column_name = 'updated_at'
  ) THEN
    EXECUTE 'ALTER TABLE public.counseling_sessions ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()';
  END IF;
  
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'counseling_sessions'
    AND column_name = 'type'
  ) THEN
    EXECUTE 'ALTER TABLE public.counseling_sessions ADD COLUMN type TEXT DEFAULT ''one_on_one''';
  END IF;
END
$$;
