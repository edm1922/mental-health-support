#!/bin/bash
echo "Running streak tracking migration..."

# Run the migration script against your Supabase database
psql -h db.YOUR_SUPABASE_PROJECT_ID.supabase.co -p 5432 -d postgres -U postgres -f supabase/migrations/20240101000000_add_streak_tracking.sql

echo "Migration completed!"
