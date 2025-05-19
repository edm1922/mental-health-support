# Database Management Guide

This guide explains how to manage the database schema for the Healmate application.

## Overview

The application uses Supabase as its database provider. The database schema includes several tables:

- `user_profiles`: Stores user profile information
- `discussion_posts`: Stores forum posts
- `discussion_comments`: Stores comments on forum posts
- `counseling_sessions`: Stores counseling session information
- `mental_health_checkins`: Stores user mental health check-ins

## Handling Database Resets

If the database schema is reset or restored from a backup, you may need to recreate tables or columns that are required by the application. There are several ways to do this:

### 1. Using the Admin Dashboard

1. Log in as an admin user
2. Navigate to `/admin/database-management`
3. Click "Check Database Schema" to see if there are any issues
4. If issues are found, click "Run Database Migration" to fix them

### 2. Using the Command Line

You can run the database migration script from the command line:

```bash
# Make sure environment variables are set
export NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
export NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Run the migration script
node scripts/run-migration.js
```

### 3. Using the API

You can call the database check API endpoint:

```javascript
const response = await fetch('/api/system/check-database', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ runMigration: true })
});

const result = await response.json();
console.log('Migration result:', result);
```

## Schema Documentation

For detailed information about the database schema, see [database-schema.md](./database-schema.md).

## Common Issues

### Missing Columns

If columns like `is_approved` in the `discussion_posts` table are missing, it can cause errors in the application. The migration script will add these columns automatically.

### Schema Cache Issues

Sometimes Supabase's schema cache can get out of sync with the actual database schema. If you're seeing errors about missing columns that actually exist, you can refresh the schema cache:

1. Navigate to `/admin/test-schema`
2. Click "Refresh Schema Cache"

### Manual SQL Fixes

If you need to manually fix the schema, you can run SQL commands in the Supabase SQL Editor:

```sql
-- Add is_approved column to discussion_posts
ALTER TABLE public.discussion_posts
ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT FALSE;

-- Add approved_by column
ALTER TABLE public.discussion_posts
ADD COLUMN IF NOT EXISTS approved_by UUID;

-- Add approved_at column
ALTER TABLE public.discussion_posts
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;
```

## Best Practices

1. **Regular Backups**: Take regular backups of your database
2. **Test Migrations**: Test migrations in a development environment before applying them to production
3. **Document Changes**: Document any schema changes in the database-schema.md file
4. **Update Migration Script**: Update the migration script when you add new tables or columns

## Troubleshooting

If you encounter issues with the database schema:

1. Check the application logs for specific error messages
2. Use the `/admin/test-schema` page to check if columns exist and are recognized
3. Try refreshing the schema cache
4. Run the database migration
5. If all else fails, manually run SQL commands in the Supabase SQL Editor
