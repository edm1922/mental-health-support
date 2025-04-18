-- Fix mental_health_checkins table script

-- First, check if the table exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'mental_health_checkins'
  ) THEN
    -- Create the table with the correct structure
    CREATE TABLE public.mental_health_checkins (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id TEXT NOT NULL,
      mood_rating INTEGER NOT NULL,
      notes TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    -- Add comment to indicate the table was created
    RAISE NOTICE 'Created mental_health_checkins table';
  ELSE
    -- Table exists, check for missing columns and add them if needed
    RAISE NOTICE 'mental_health_checkins table already exists, checking columns...';
    
    -- Check for user_id column
    IF NOT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'mental_health_checkins' 
      AND column_name = 'user_id'
    ) THEN
      ALTER TABLE public.mental_health_checkins ADD COLUMN user_id TEXT;
      RAISE NOTICE 'Added user_id column';
    END IF;
    
    -- Check for mood_rating column
    IF NOT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'mental_health_checkins' 
      AND column_name = 'mood_rating'
    ) THEN
      ALTER TABLE public.mental_health_checkins ADD COLUMN mood_rating INTEGER;
      RAISE NOTICE 'Added mood_rating column';
    END IF;
    
    -- Check for notes column
    IF NOT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'mental_health_checkins' 
      AND column_name = 'notes'
    ) THEN
      ALTER TABLE public.mental_health_checkins ADD COLUMN notes TEXT;
      RAISE NOTICE 'Added notes column';
    END IF;
    
    -- Check for created_at column
    IF NOT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'mental_health_checkins' 
      AND column_name = 'created_at'
    ) THEN
      ALTER TABLE public.mental_health_checkins ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
      RAISE NOTICE 'Added created_at column';
    END IF;
  END IF;
END
$$;

-- Add Row Level Security (RLS) policies to the table
ALTER TABLE public.mental_health_checkins ENABLE ROW LEVEL SECURITY;

-- Create policy for users to read their own check-ins
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_policies 
    WHERE tablename = 'mental_health_checkins' 
    AND policyname = 'Users can read their own check-ins'
  ) THEN
    CREATE POLICY "Users can read their own check-ins"
      ON public.mental_health_checkins
      FOR SELECT
      USING (auth.uid()::text = user_id);
    
    RAISE NOTICE 'Created policy: Users can read their own check-ins';
  END IF;
END
$$;

-- Create policy for users to insert their own check-ins
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_policies 
    WHERE tablename = 'mental_health_checkins' 
    AND policyname = 'Users can insert their own check-ins'
  ) THEN
    CREATE POLICY "Users can insert their own check-ins"
      ON public.mental_health_checkins
      FOR INSERT
      WITH CHECK (auth.uid()::text = user_id);
    
    RAISE NOTICE 'Created policy: Users can insert their own check-ins';
  END IF;
END
$$;

-- Create policy for users to update their own check-ins
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_policies 
    WHERE tablename = 'mental_health_checkins' 
    AND policyname = 'Users can update their own check-ins'
  ) THEN
    CREATE POLICY "Users can update their own check-ins"
      ON public.mental_health_checkins
      FOR UPDATE
      USING (auth.uid()::text = user_id);
    
    RAISE NOTICE 'Created policy: Users can update their own check-ins';
  END IF;
END
$$;

-- Create policy for users to delete their own check-ins
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_policies 
    WHERE tablename = 'mental_health_checkins' 
    AND policyname = 'Users can delete their own check-ins'
  ) THEN
    CREATE POLICY "Users can delete their own check-ins"
      ON public.mental_health_checkins
      FOR DELETE
      USING (auth.uid()::text = user_id);
    
    RAISE NOTICE 'Created policy: Users can delete their own check-ins';
  END IF;
END
$$;

-- Create index on user_id for faster queries
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_indexes 
    WHERE tablename = 'mental_health_checkins' 
    AND indexname = 'mental_health_checkins_user_id_idx'
  ) THEN
    CREATE INDEX mental_health_checkins_user_id_idx ON public.mental_health_checkins (user_id);
    RAISE NOTICE 'Created index on user_id';
  END IF;
END
$$;

-- Create index on created_at for faster sorting
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_indexes 
    WHERE tablename = 'mental_health_checkins' 
    AND indexname = 'mental_health_checkins_created_at_idx'
  ) THEN
    CREATE INDEX mental_health_checkins_created_at_idx ON public.mental_health_checkins (created_at DESC);
    RAISE NOTICE 'Created index on created_at';
  END IF;
END
$$;

-- Verify the table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM 
  information_schema.columns
WHERE 
  table_schema = 'public' 
  AND table_name = 'mental_health_checkins'
ORDER BY 
  ordinal_position;

-- Verify RLS policies
SELECT 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual, 
  with_check
FROM 
  pg_policies
WHERE 
  tablename = 'mental_health_checkins';

-- Verify indexes
SELECT 
  indexname, 
  indexdef
FROM 
  pg_indexes
WHERE 
  tablename = 'mental_health_checkins';
