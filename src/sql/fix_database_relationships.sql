-- Fix database relationships for the messaging system
DO $$
BEGIN
  -- First, check if the session_messages table exists
  IF EXISTS (
    SELECT FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'session_messages'
  ) THEN
    -- Drop existing foreign key constraints if they exist
    BEGIN
      ALTER TABLE public.session_messages DROP CONSTRAINT IF EXISTS session_messages_sender_id_fkey;
      EXCEPTION WHEN OTHERS THEN NULL;
    END;
    
    BEGIN
      ALTER TABLE public.session_messages DROP CONSTRAINT IF EXISTS session_messages_recipient_id_fkey;
      EXCEPTION WHEN OTHERS THEN NULL;
    END;
    
    -- Create foreign key references to user_profiles instead of auth.users
    BEGIN
      -- First check if the columns exist in user_profiles
      IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'user_profiles'
        AND column_name = 'id'
      ) THEN
        -- Add foreign key constraints
        ALTER TABLE public.session_messages 
        ADD CONSTRAINT session_messages_sender_id_fkey 
        FOREIGN KEY (sender_id) 
        REFERENCES public.user_profiles(id);
        
        ALTER TABLE public.session_messages 
        ADD CONSTRAINT session_messages_recipient_id_fkey 
        FOREIGN KEY (recipient_id) 
        REFERENCES public.user_profiles(id);
        
        RAISE NOTICE 'Foreign key constraints added to session_messages table';
      ELSE
        RAISE NOTICE 'user_profiles table does not have an id column';
      END IF;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Error adding foreign key constraints: %', SQLERRM;
    END;
    
    -- Create indexes for better performance if they don't exist
    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE schemaname = 'public' 
      AND tablename = 'session_messages' 
      AND indexname = 'session_messages_sender_id_idx'
    ) THEN
      CREATE INDEX session_messages_sender_id_idx ON public.session_messages(sender_id);
    END IF;
    
    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE schemaname = 'public' 
      AND tablename = 'session_messages' 
      AND indexname = 'session_messages_recipient_id_idx'
    ) THEN
      CREATE INDEX session_messages_recipient_id_idx ON public.session_messages(recipient_id);
    END IF;
    
    -- Refresh the schema cache to make sure Supabase recognizes the relationships
    -- This is a workaround for the "Could not find a relationship" error
    BEGIN
      -- Notify PostgREST to refresh its schema cache
      NOTIFY pgrst, 'reload schema';
      RAISE NOTICE 'Schema cache refresh requested';
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Error refreshing schema cache: %', SQLERRM;
    END;
  ELSE
    RAISE NOTICE 'session_messages table does not exist';
  END IF;
  
  -- Check if the counseling_sessions table exists and fix its relationships
  IF EXISTS (
    SELECT FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'counseling_sessions'
  ) THEN
    -- Drop existing foreign key constraints if they exist
    BEGIN
      ALTER TABLE public.counseling_sessions DROP CONSTRAINT IF EXISTS counseling_sessions_counselor_id_fkey;
      EXCEPTION WHEN OTHERS THEN NULL;
    END;
    
    BEGIN
      ALTER TABLE public.counseling_sessions DROP CONSTRAINT IF EXISTS counseling_sessions_patient_id_fkey;
      EXCEPTION WHEN OTHERS THEN NULL;
    END;
    
    BEGIN
      ALTER TABLE public.counseling_sessions DROP CONSTRAINT IF EXISTS counseling_sessions_client_id_fkey;
      EXCEPTION WHEN OTHERS THEN NULL;
    END;
    
    -- Create foreign key references to user_profiles
    BEGIN
      -- First check if the columns exist in counseling_sessions
      IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'counseling_sessions'
        AND column_name = 'counselor_id'
      ) THEN
        -- Add foreign key constraint for counselor_id
        ALTER TABLE public.counseling_sessions 
        ADD CONSTRAINT counseling_sessions_counselor_id_fkey 
        FOREIGN KEY (counselor_id) 
        REFERENCES public.user_profiles(id);
        
        RAISE NOTICE 'Foreign key constraint added for counselor_id';
      ELSE
        RAISE NOTICE 'counseling_sessions table does not have a counselor_id column';
      END IF;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Error adding counselor_id foreign key constraint: %', SQLERRM;
    END;
    
    BEGIN
      -- Check if patient_id column exists
      IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'counseling_sessions'
        AND column_name = 'patient_id'
      ) THEN
        -- Add foreign key constraint for patient_id
        ALTER TABLE public.counseling_sessions 
        ADD CONSTRAINT counseling_sessions_patient_id_fkey 
        FOREIGN KEY (patient_id) 
        REFERENCES public.user_profiles(id);
        
        RAISE NOTICE 'Foreign key constraint added for patient_id';
      ELSE
        RAISE NOTICE 'counseling_sessions table does not have a patient_id column';
      END IF;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Error adding patient_id foreign key constraint: %', SQLERRM;
    END;
    
    BEGIN
      -- Check if client_id column exists
      IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'counseling_sessions'
        AND column_name = 'client_id'
      ) THEN
        -- Add foreign key constraint for client_id
        ALTER TABLE public.counseling_sessions 
        ADD CONSTRAINT counseling_sessions_client_id_fkey 
        FOREIGN KEY (client_id) 
        REFERENCES public.user_profiles(id);
        
        RAISE NOTICE 'Foreign key constraint added for client_id';
      ELSE
        RAISE NOTICE 'counseling_sessions table does not have a client_id column';
      END IF;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Error adding client_id foreign key constraint: %', SQLERRM;
    END;
    
    -- Create indexes for better performance if they don't exist
    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE schemaname = 'public' 
      AND tablename = 'counseling_sessions' 
      AND indexname = 'counseling_sessions_counselor_id_idx'
    ) THEN
      CREATE INDEX counseling_sessions_counselor_id_idx ON public.counseling_sessions(counselor_id);
    END IF;
    
    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE schemaname = 'public' 
      AND tablename = 'counseling_sessions' 
      AND indexname = 'counseling_sessions_patient_id_idx'
    ) THEN
      CREATE INDEX counseling_sessions_patient_id_idx ON public.counseling_sessions(patient_id);
    END IF;
    
    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE schemaname = 'public' 
      AND tablename = 'counseling_sessions' 
      AND indexname = 'counseling_sessions_client_id_idx'
    ) THEN
      CREATE INDEX counseling_sessions_client_id_idx ON public.counseling_sessions(client_id);
    END IF;
    
    -- Refresh the schema cache to make sure Supabase recognizes the relationships
    BEGIN
      -- Notify PostgREST to refresh its schema cache
      NOTIFY pgrst, 'reload schema';
      RAISE NOTICE 'Schema cache refresh requested';
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Error refreshing schema cache: %', SQLERRM;
    END;
  ELSE
    RAISE NOTICE 'counseling_sessions table does not exist';
  END IF;
END
$$;
