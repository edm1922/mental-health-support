# Authentication Fix for Mental Health Support App (UUID Version)

This document provides instructions on how to fix authentication issues in the Mental Health Support application, specifically addressing the mismatch between authentication systems.

## Problem Diagnosis

After analyzing the database, we found:

1. The official Supabase `auth.users` table uses **UUID** for user IDs (4 users exist)
2. The custom `public.auth_users` table uses **bigint** for user IDs (0 users exist)
3. The `session_messages` table uses **UUID** for all IDs

The key issue is that the application is trying to use a custom authentication system with bigint IDs, but the actual users are in the official Supabase auth system with UUID IDs.

## Solution Implemented

We've created a solution that works directly with the official Supabase auth system:

1. **SQL Functions**:
   - `get_current_user()` - Gets the current authenticated user from auth.users
   - `get_messages_for_user(uuid)` - Gets messages for a user with UUID ID
   - `uuid_to_bigint(uuid)` - Helper function to convert UUID to bigint if needed

2. **API Endpoints**:
   - `/api/auth/uuid-check` - Checks authentication using UUID IDs
   - `/api/messages/uuid-get` - Gets messages using UUID IDs

3. **Frontend Components**:
   - Updated `useUser.js` to work with UUID IDs
   - Created `UUIDMessaging.jsx` component for displaying messages
   - Updated `messages/page.jsx` to use the new UUID-based components

## How to Apply the Fix

1. **Run the SQL Script**:
   ```sql
   -- Create a function to convert UUID to bigint
   CREATE OR REPLACE FUNCTION uuid_to_bigint(id uuid)
   RETURNS bigint
   LANGUAGE plpgsql
   SECURITY DEFINER
   AS $$
   DECLARE
     result bigint;
   BEGIN
     -- Simple hash function to convert UUID to bigint
     SELECT ('x' || substr(id::text, 1, 16))::bit(64)::bigint INTO result;
     RETURN result;
   END;
   $$;

   -- Create a function to get the current user
   CREATE OR REPLACE FUNCTION get_current_user()
   RETURNS jsonb
   LANGUAGE plpgsql
   SECURITY DEFINER
   AS $$
   DECLARE
     current_user_id uuid;
     user_data jsonb;
   BEGIN
     -- Get the current user ID from the auth context
     SELECT auth.uid() INTO current_user_id;
     
     IF current_user_id IS NULL THEN
       RETURN jsonb_build_object('authenticated', false, 'error', 'Not authenticated');
     END IF;
     
     -- Get user data from auth.users
     SELECT jsonb_build_object(
       'id', id,
       'email', email,
       'name', COALESCE(raw_user_meta_data->>'name', email),
       'role', role
     ) INTO user_data
     FROM auth.users
     WHERE id = current_user_id;
     
     IF user_data IS NULL THEN
       RETURN jsonb_build_object('authenticated', false, 'error', 'User not found');
     END IF;
     
     -- Return user data with authentication status
     RETURN jsonb_build_object(
       'authenticated', true,
       'user', user_data
     );
   END;
   $$;

   -- Create a function to get messages for a user
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
   GRANT EXECUTE ON FUNCTION get_current_user() TO authenticated;
   GRANT EXECUTE ON FUNCTION get_current_user() TO anon;
   GRANT EXECUTE ON FUNCTION get_messages_for_user(uuid) TO authenticated;
   GRANT EXECUTE ON FUNCTION uuid_to_bigint(uuid) TO authenticated;
   GRANT EXECUTE ON FUNCTION uuid_to_bigint(uuid) TO anon;
   ```

2. **Deploy the Updated Code**:
   - The code changes have been made to use the UUID-based authentication system
   - The application now works with the official Supabase auth system

3. **Test the Messages Page**:
   - Navigate to the Messages page in your application
   - The page should now use the UUID authentication system
   - If you're logged in, you should see your messages
   - If you're not logged in, you should see a sign-in button

## Technical Details

### Authentication Flow

1. The application calls the `/api/auth/uuid-check` endpoint
2. The endpoint calls the `get_current_user()` SQL function
3. The function checks if the user is authenticated in the official Supabase auth system
4. If authenticated, it returns the user data from `auth.users`

### Messages Flow

1. The application calls the `/api/messages/uuid-get` endpoint
2. The endpoint first checks authentication using `get_current_user()`
3. If authenticated, it calls `get_messages_for_user(uuid)` to get the user's messages
4. It then fetches related data (sessions, user profiles) and returns everything to the client

### User Profile Handling

1. The `useUser.js` hook checks if the user has a profile in `user_profiles`
2. If not, it creates one using the user data from `auth.users`
3. This ensures that all users have a profile, even if they were created directly in the Supabase auth system

## Troubleshooting

If you're still experiencing issues:

1. Check the browser console for error messages
2. Verify that the SQL functions were created successfully
3. Make sure the API endpoints are returning the expected data
4. Check that the user ID is being correctly used as a UUID

If all else fails, you can try clearing your browser's local storage and cookies, then signing in again.

## Future Improvements

For a more robust solution, consider:

1. Setting up a trigger to automatically sync users from `auth.users` to `public.auth_users` if you need to maintain both systems
2. Standardizing on UUID IDs throughout your application
3. Using Supabase's built-in Row Level Security (RLS) policies for better security

## Contact

If you need further assistance, please contact the development team.
