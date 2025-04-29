-- Fix missing ID column in mental_health_checkins table

-- First, let's check the current structure of the table
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

-- Add the ID column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'mental_health_checkins' 
    AND column_name = 'id'
  ) THEN
    -- Add the ID column
    ALTER TABLE public.mental_health_checkins ADD COLUMN id UUID DEFAULT gen_random_uuid() PRIMARY KEY;
    RAISE NOTICE 'Added id column as primary key';
  ELSE
    RAISE NOTICE 'id column already exists';
  END IF;
END
$$;

-- Check if we need to set the id column as the primary key
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.table_constraints
    WHERE table_schema = 'public'
    AND table_name = 'mental_health_checkins'
    AND constraint_type = 'PRIMARY KEY'
  ) THEN
    -- Add primary key constraint
    ALTER TABLE public.mental_health_checkins ADD PRIMARY KEY (id);
    RAISE NOTICE 'Added primary key constraint on id column';
  ELSE
    RAISE NOTICE 'Primary key constraint already exists';
  END IF;
END
$$;

-- Verify the table structure after changes
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM 
  information_schema.columns
WHERE 
  table_schema = 'public' 
  AND table_name = 'mental_health_checkins'
ORDER BY 
  ordinal_position;

-- Verify primary key
SELECT 
  tc.constraint_name, 
  tc.constraint_type,
  kcu.column_name
FROM 
  information_schema.table_constraints tc
JOIN 
  information_schema.key_column_usage kcu
ON 
  tc.constraint_name = kcu.constraint_name
WHERE 
  tc.table_schema = 'public'
  AND tc.table_name = 'mental_health_checkins'
  AND tc.constraint_type = 'PRIMARY KEY';
