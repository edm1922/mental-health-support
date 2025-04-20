-- Fix the relationship between mental_health_checkins and user_profiles tables

-- First, check if the mental_health_checkins table exists
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
      user_id UUID REFERENCES auth.users(id),
      mood_rating INTEGER NOT NULL,
      notes TEXT,
      sleep_hours INTEGER,
      stress_level INTEGER,
      anxiety_level INTEGER,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    RAISE NOTICE 'Created mental_health_checkins table with proper references';
  ELSE
    -- Check if the table has the wrong structure (with column_name, data_type columns)
    IF EXISTS (
      SELECT FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'mental_health_checkins'
      AND column_name = 'column_name'
    ) THEN
      -- The table has the wrong structure, drop and recreate it
      DROP TABLE public.mental_health_checkins;

      -- Create the table with the correct structure
      CREATE TABLE public.mental_health_checkins (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES auth.users(id),
        mood_rating INTEGER NOT NULL,
        notes TEXT,
        sleep_hours INTEGER,
        stress_level INTEGER,
        anxiety_level INTEGER,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      RAISE NOTICE 'Recreated mental_health_checkins table with proper structure';
    ELSE
      -- Table exists with proper structure, check the user_id column type
      RAISE NOTICE 'mental_health_checkins table exists, checking column types...';

      -- Check user_id column type
      IF EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'mental_health_checkins'
        AND column_name = 'user_id'
        AND data_type = 'text'
      ) THEN
        -- Create a temporary table with the correct structure
        CREATE TABLE public.mental_health_checkins_new (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES auth.users(id),
          mood_rating INTEGER NOT NULL,
          notes TEXT,
          sleep_hours INTEGER,
          stress_level INTEGER,
          anxiety_level INTEGER,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Copy data from old table to new table, converting user_id from text to UUID
        INSERT INTO public.mental_health_checkins_new (
          id,
          user_id,
          mood_rating,
          notes,
          created_at
        )
        SELECT
          COALESCE(id, gen_random_uuid())::UUID,
          CASE
            WHEN user_id IS NULL THEN NULL
            WHEN user_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN user_id::UUID
            ELSE NULL
          END,
          COALESCE(mood_rating, 3)::INTEGER,
          notes,
          COALESCE(created_at, NOW())
        FROM public.mental_health_checkins
        ON CONFLICT (id) DO NOTHING;

        -- Drop the old table
        DROP TABLE public.mental_health_checkins;

        -- Rename the new table to the original name
        ALTER TABLE public.mental_health_checkins_new RENAME TO mental_health_checkins;

        RAISE NOTICE 'Fixed user_id column type in mental_health_checkins table';
      ELSE
        -- Check if the user_id column has a foreign key constraint
        IF NOT EXISTS (
          SELECT FROM information_schema.table_constraints tc
          JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
          WHERE tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_schema = 'public'
          AND tc.table_name = 'mental_health_checkins'
          AND ccu.column_name = 'user_id'
        ) THEN
          -- Add the foreign key constraint
          ALTER TABLE public.mental_health_checkins
          ADD CONSTRAINT mental_health_checkins_user_id_fkey
          FOREIGN KEY (user_id)
          REFERENCES auth.users(id);

          RAISE NOTICE 'Added foreign key constraint to user_id column';
        ELSE
          RAISE NOTICE 'user_id column already has the correct type and foreign key constraint';
        END IF;
      END IF;
    END IF;
  END IF;
END
$$;

-- Enable Row Level Security
ALTER TABLE public.mental_health_checkins ENABLE ROW LEVEL SECURITY;

-- Create policies for mental_health_checkins
DO $$
BEGIN
  -- Policy for users to select their own check-ins
  IF NOT EXISTS (
    SELECT FROM pg_policies
    WHERE tablename = 'mental_health_checkins'
    AND policyname = 'Users can view their own check-ins'
  ) THEN
    CREATE POLICY "Users can view their own check-ins"
      ON public.mental_health_checkins
      FOR SELECT
      USING (auth.uid() = user_id);

    RAISE NOTICE 'Created policy: Users can view their own check-ins';
  END IF;

  -- Policy for users to insert their own check-ins
  IF NOT EXISTS (
    SELECT FROM pg_policies
    WHERE tablename = 'mental_health_checkins'
    AND policyname = 'Users can insert their own check-ins'
  ) THEN
    CREATE POLICY "Users can insert their own check-ins"
      ON public.mental_health_checkins
      FOR INSERT
      WITH CHECK (auth.uid() = user_id);

    RAISE NOTICE 'Created policy: Users can insert their own check-ins';
  END IF;

  -- Policy for users to update their own check-ins
  IF NOT EXISTS (
    SELECT FROM pg_policies
    WHERE tablename = 'mental_health_checkins'
    AND policyname = 'Users can update their own check-ins'
  ) THEN
    CREATE POLICY "Users can update their own check-ins"
      ON public.mental_health_checkins
      FOR UPDATE
      USING (auth.uid() = user_id);

    RAISE NOTICE 'Created policy: Users can update their own check-ins';
  END IF;

  -- Policy for users to delete their own check-ins
  IF NOT EXISTS (
    SELECT FROM pg_policies
    WHERE tablename = 'mental_health_checkins'
    AND policyname = 'Users can delete their own check-ins'
  ) THEN
    CREATE POLICY "Users can delete their own check-ins"
      ON public.mental_health_checkins
      FOR DELETE
      USING (auth.uid() = user_id);

    RAISE NOTICE 'Created policy: Users can delete their own check-ins';
  END IF;

  -- Policy for counselors to view their patients' check-ins
  IF NOT EXISTS (
    SELECT FROM pg_policies
    WHERE tablename = 'mental_health_checkins'
    AND policyname = 'Counselors can view their patients check-ins'
  ) THEN
    CREATE POLICY "Counselors can view their patients check-ins"
      ON public.mental_health_checkins
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM user_profiles
          WHERE id = auth.uid()
          AND role = 'counselor'
          AND EXISTS (
            SELECT 1 FROM counseling_sessions
            WHERE counselor_id = auth.uid()
            AND patient_id = mental_health_checkins.user_id
          )
        )
      );

    RAISE NOTICE 'Created policy: Counselors can view their patients check-ins';
  END IF;

  -- Policy for admins to view all check-ins
  IF NOT EXISTS (
    SELECT FROM pg_policies
    WHERE tablename = 'mental_health_checkins'
    AND policyname = 'Admins can view all check-ins'
  ) THEN
    CREATE POLICY "Admins can view all check-ins"
      ON public.mental_health_checkins
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM user_profiles
          WHERE id = auth.uid()
          AND role = 'admin'
        )
      );

    RAISE NOTICE 'Created policy: Admins can view all check-ins';
  END IF;
END
$$;

-- Create indexes for better performance
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
