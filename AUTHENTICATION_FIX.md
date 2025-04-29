# Authentication Fix for Mental Health Support App

This document provides instructions on how to fix authentication issues in the Mental Health Support application, particularly related to the mismatch between UUID and bigint ID types.

## Problem Description

The application is experiencing authentication issues because:

1. The Supabase auth system uses UUID for user IDs
2. The custom auth tables (`auth_users`, `auth_accounts`, etc.) use bigint IDs
3. This mismatch causes authentication failures when trying to access messages and other user-specific data

## Solution

We've implemented a solution that:

1. Creates SQL functions to handle the conversion between UUID and bigint IDs
2. Adds API endpoints that use these functions to authenticate users
3. Updates the frontend components to use these new endpoints
4. Provides a migration script to ensure the database schema is correct

## How to Fix

### Step 1: Run the Database Migration Script

1. Go to the Supabase dashboard for your project
2. Navigate to the SQL Editor
3. Copy the contents of the file `supabase/migrations/20240424_fix_auth_schema.sql`
4. Paste it into the SQL Editor and run it
5. This will create the necessary tables and functions to handle bigint IDs

### Step 2: Verify the API Endpoints

The following API endpoints have been added to handle bigint authentication:

- `/api/auth/bigint-check` - Checks authentication using bigint IDs
- `/api/messages/bigint-get` - Gets messages using bigint IDs

These endpoints use the SQL functions created in Step 1 to properly handle the authentication.

### Step 3: Test the Messages Page

1. Navigate to the Messages page in your application
2. The page should now use the bigint authentication system
3. If you're logged in, you should see your messages
4. If you're not logged in, you should see a sign-in button

## Technical Details

### Database Schema

The authentication system uses the following tables:

- `auth_users` - Stores user information with bigint IDs
- `auth_accounts` - Stores account information linked to users
- `auth_sessions` - Stores session information
- `auth_verification_token` - Stores verification tokens

### SQL Functions

The following SQL functions have been created:

- `check_auth_direct()` - Checks if a user is authenticated using bigint IDs
- `get_messages_for_user(user_id_param bigint)` - Gets messages for a user with a bigint ID
- `get_current_user_id()` - Gets the current user's ID as a bigint
- `uuid_to_bigint(id uuid)` - Converts a UUID to a bigint
- `bigint_to_uuid(id bigint)` - Converts a bigint to a UUID

### Frontend Components

The following frontend components have been updated:

- `useUser.js` - Updated to handle bigint IDs
- `messages/page.jsx` - Updated to use the new API endpoints
- `BigintMessaging.jsx` - New component to display messages using bigint IDs

## Troubleshooting

If you're still experiencing issues:

1. Check the browser console for error messages
2. Verify that the SQL functions were created successfully
3. Make sure the API endpoints are returning the expected data
4. Check that the user ID is being correctly converted between UUID and bigint

If all else fails, you can try clearing your browser's local storage and cookies, then signing in again.

## Future Improvements

For a more permanent solution, consider:

1. Migrating all tables to use the same ID type (either UUID or bigint)
2. Using Supabase's built-in auth system more directly
3. Implementing a more robust ID mapping system

## Contact

If you need further assistance, please contact the development team.
