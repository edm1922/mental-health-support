-- This SQL script can be run directly in the Supabase SQL editor to debug and fix the database

-- Step 1: Check if the session_messages table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'session_messages'
);

-- Step 2: Check the structure of the session_messages table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'session_messages';

-- Step 3: Check if the user_profiles exist
SELECT * FROM public.user_profiles 
WHERE id IN ('4fd19577-3876-4087-b18b-51a7b194460a', '1ccdfb9d-df48-4250-ba89-68c181b8c012');

-- Step 4: Check if the counseling session exists
SELECT * FROM public.counseling_sessions 
WHERE id = 'f19de89f-506a-4207-aa21-f09bda8d0dfb'::uuid;

-- Step 5: Check for any messages in the session
SELECT * FROM public.session_messages 
WHERE session_id = 'f19de89f-506a-4207-aa21-f09bda8d0dfb'::uuid;

-- Step 6: Check for foreign key constraints
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM
  information_schema.table_constraints AS tc
  JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
  JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name = 'session_messages';

-- Step 7: Check RLS status
SELECT relname, relrowsecurity
FROM pg_class
WHERE relname = 'session_messages';

-- Step 8: Check policies
SELECT * FROM pg_policies WHERE tablename = 'session_messages';

-- Step 9: Insert a test message
INSERT INTO public.session_messages (
  session_id, 
  sender_id, 
  recipient_id, 
  message,
  is_read,
  created_at,
  updated_at
) VALUES (
  'f19de89f-506a-4207-aa21-f09bda8d0dfb'::uuid, 
  '4fd19577-3876-4087-b18b-51a7b194460a'::uuid, 
  '1ccdfb9d-df48-4250-ba89-68c181b8c012'::uuid, 
  'Test message from SQL editor',
  false,
  now(),
  now()
) RETURNING *;

-- Step 10: Verify the message was inserted
SELECT * FROM public.session_messages 
WHERE session_id = 'f19de89f-506a-4207-aa21-f09bda8d0dfb'::uuid
ORDER BY created_at DESC
LIMIT 5;

-- Step 11: Disable RLS on the session_messages table
ALTER TABLE public.session_messages DISABLE ROW LEVEL SECURITY;

-- Step 12: Create a permissive policy
DROP POLICY IF EXISTS "Allow all operations" ON public.session_messages;
CREATE POLICY "Allow all operations" ON public.session_messages
FOR ALL
USING (true)
WITH CHECK (true);

-- Step 13: Enable RLS with the permissive policy
ALTER TABLE public.session_messages ENABLE ROW LEVEL SECURITY;
