# Supabase Setup Instructions

This document provides instructions for setting up your Supabase database for use with this application.

## Prerequisites

1. A Supabase account
2. Access to the Supabase dashboard for your project

## Step 1: Set Up Environment Variables

Make sure your `.env.local` file contains the following variables:

```
NEXT_PUBLIC_SUPABASE_URL=https://euebogudyyeodzkvhyef.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV1ZWJvZ3VkeXllb2R6a3ZoeWVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4NjM5NDgsImV4cCI6MjA2MDQzOTk0OH0.b68JOxrpuFwWb2K3DraYvv32uqomvK0r1imbOCG0HKc
```

## Step 2: Create SQL Functions in Supabase

1. Log in to your Supabase dashboard
2. Go to the SQL Editor
3. Create a new query
4. Copy and paste the contents of the `supabase-functions.sql` file into the query editor
5. Run the query

This will create the following functions:
- `exec_sql(sql text)`: Executes SQL queries
- `version()`: Returns the database version
- `get_connection_info()`: Returns information about the current connection

## Step 3: Initialize the Database Schema

You have two options for initializing the database schema:

### Option 1: Using the Web Interface

1. Start the development server: `npm run dev`
2. Navigate to http://localhost:3000/supabase-test
3. Click the "Initialize Database" button

### Option 2: Using the Command Line

1. Run the initialization script: `node init-database.js`

## Step 4: Verify the Setup

1. Navigate to http://localhost:3000/supabase-test
2. Verify that the connection status is "Connected to Supabase"
3. Verify that the list of tables includes:
   - user_profiles
   - counselor_applications
   - mental_health_checkins
   - counseling_sessions
   - community_posts

## Troubleshooting

### Connection Issues

If you're having trouble connecting to Supabase:

1. Verify that your environment variables are correct
2. Check your network connection
3. Make sure your Supabase project is active

### SQL Function Errors

If you're getting errors about missing SQL functions:

1. Make sure you've run the SQL script in the Supabase SQL Editor
2. Check the Supabase logs for any errors

### Database Initialization Errors

If you're having trouble initializing the database:

1. Check the browser console for error messages
2. Try running the initialization script from the command line
3. Make sure you have the necessary permissions in Supabase

## Additional Resources

- [Supabase Documentation](https://supabase.io/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase JavaScript Client](https://github.com/supabase/supabase-js)
