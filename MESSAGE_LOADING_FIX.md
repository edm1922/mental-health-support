# Message Loading Fix for Healmate App

This document provides instructions on how to fix the message loading issue in the Healmate application.

## Problem Diagnosis

After fixing the authentication issue, we're now facing a message loading issue. The authentication error is gone, but the messages are not loading. This could be due to several reasons:

1. The user doesn't have any messages
2. The user doesn't have any counseling sessions
3. There's an issue with the SQL functions
4. There's a mismatch between the user ID types

## Solution

We've created a solution that addresses these potential issues:

1. **SQL Functions**:
   - Updated `get_messages_for_user` to be more robust
   - Added `user_has_messages` to check if a user has any messages
   - Added `user_has_sessions` to check if a user has any sessions
   - Added `get_tables` to get all tables in the database

2. **API Endpoints**:
   - Updated `/api/messages/uuid-get` to handle the case when there are no messages
   - Added `/api/debug` to help diagnose the issue

3. **Frontend Components**:
   - Updated `UUIDMessaging.jsx` to add more logging
   - Updated `messages/page.jsx` to handle the case when there are no messages

## How to Apply the Fix

1. **Run the SQL Scripts**:
   ```sql
   -- Improved function to get messages for a user
   CREATE OR REPLACE FUNCTION get_messages_for_user(user_uuid uuid)
   RETURNS TABLE (
     id uuid,
     session_id uuid,
     sender_id uuid,
     recipient_id uuid,
     message text,
     is_read boolean,
     created_at timestamptz
   )
   LANGUAGE plpgsql
   SECURITY DEFINER
   AS $$
   BEGIN
     -- Log the user ID for debugging
     RAISE NOTICE 'Getting messages for user: %', user_uuid;

     -- Check if the user exists in user_profiles
     IF NOT EXISTS (SELECT 1 FROM public.user_profiles WHERE id = user_uuid) THEN
       RAISE NOTICE 'User not found in user_profiles: %', user_uuid;
       -- Return empty result set instead of raising an exception
       RETURN;
     END IF;

     -- Return messages for the user
     RETURN QUERY
     SELECT
       sm.id,
       sm.session_id,
       sm.sender_id,
       sm.recipient_id,
       sm.message,
       sm.is_read,
       sm.created_at
     FROM
       public.session_messages sm
     WHERE
       sm.sender_id = user_uuid OR sm.recipient_id = user_uuid
     ORDER BY
       sm.created_at DESC;
   END;
   $$;

   -- Grant execute permissions
   GRANT EXECUTE ON FUNCTION get_messages_for_user(uuid) TO authenticated;
   GRANT EXECUTE ON FUNCTION get_messages_for_user(uuid) TO anon;

   -- Function to check if a user has any messages
   CREATE OR REPLACE FUNCTION user_has_messages(user_uuid uuid)
   RETURNS boolean
   LANGUAGE plpgsql
   SECURITY DEFINER
   AS $$
   DECLARE
     message_count integer;
   BEGIN
     SELECT COUNT(*) INTO message_count
     FROM public.session_messages
     WHERE sender_id = user_uuid OR recipient_id = user_uuid;

     RETURN message_count > 0;
   END;
   $$;

   -- Grant execute permissions
   GRANT EXECUTE ON FUNCTION user_has_messages(uuid) TO authenticated;
   GRANT EXECUTE ON FUNCTION user_has_messages(uuid) TO anon;

   -- Function to check if a user has any sessions
   CREATE OR REPLACE FUNCTION user_has_sessions(user_uuid uuid)
   RETURNS boolean
   LANGUAGE plpgsql
   SECURITY DEFINER
   AS $$
   DECLARE
     session_count integer;
   BEGIN
     SELECT COUNT(*) INTO session_count
     FROM public.counseling_sessions
     WHERE counselor_id = user_uuid OR patient_id = user_uuid;

     RETURN session_count > 0;
   END;
   $$;

   -- Grant execute permissions
   GRANT EXECUTE ON FUNCTION user_has_sessions(uuid) TO authenticated;
   GRANT EXECUTE ON FUNCTION user_has_sessions(uuid) TO anon;

   -- Function to get all tables in the database
   CREATE OR REPLACE FUNCTION get_tables()
   RETURNS TABLE (
     schema_name text,
     table_name text,
     row_count bigint
   )
   LANGUAGE plpgsql
   SECURITY DEFINER
   AS $$
   BEGIN
     RETURN QUERY
     SELECT
       n.nspname AS schema_name,
       c.relname AS table_name,
       (SELECT c.reltuples::bigint AS row_count)
     FROM
       pg_class c
     JOIN
       pg_namespace n ON n.oid = c.relnamespace
     WHERE
       c.relkind = 'r' -- Only tables
       AND n.nspname NOT IN ('pg_catalog', 'information_schema')
     ORDER BY
       n.nspname,
       c.relname;
   END;
   $$;

   -- Grant execute permissions
   GRANT EXECUTE ON FUNCTION get_tables() TO authenticated;
   GRANT EXECUTE ON FUNCTION get_tables() TO anon;
   ```

2. **Check if the User Has a Profile**:
   - Navigate to the `/api/debug` endpoint in your browser
   - Check if the user has a profile in the `user_profiles` table
   - If not, create one using the following SQL:
   ```sql
   INSERT INTO public.user_profiles (id, display_name, role, created_at, updated_at)
   VALUES (
     'YOUR_USER_ID', -- Replace with your user ID from auth.users
     'Your Name', -- Replace with your name
     'user', -- Or 'admin' or 'counselor'
     NOW(),
     NOW()
   );
   ```

3. **Check if the User Has Any Sessions**:
   - Navigate to the `/api/debug` endpoint in your browser
   - Check if the user has any sessions in the `counseling_sessions` table
   - If not, create one using the following SQL:
   ```sql
   INSERT INTO public.counseling_sessions (counselor_id, patient_id, session_date, status)
   VALUES (
     'COUNSELOR_USER_ID', -- Replace with a counselor user ID
     'PATIENT_USER_ID', -- Replace with a patient user ID
     NOW(),
     'scheduled'
   );
   ```

4. **Check if the User Has Any Messages**:
   - Navigate to the `/api/debug` endpoint in your browser
   - Check if the user has any messages in the `session_messages` table
   - If not, create one using the following SQL:
   ```sql
   INSERT INTO public.session_messages (session_id, sender_id, recipient_id, message, is_read)
   VALUES (
     'SESSION_ID', -- Replace with a session ID from counseling_sessions
     'SENDER_USER_ID', -- Replace with a user ID
     'RECIPIENT_USER_ID', -- Replace with another user ID
     'Hello, this is a test message',
     false
   );
   ```

## Troubleshooting

If you're still experiencing issues:

1. Check the browser console for error messages
2. Navigate to the `/api/debug` endpoint to see the user's data
3. Run the SQL scripts to fix the database functions
4. Make sure the user has a profile, sessions, and messages

## Contact

If you need further assistance, please contact the development team.
