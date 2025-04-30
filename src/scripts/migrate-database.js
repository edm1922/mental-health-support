/**
 * Database Migration Script
 * 
 * This script ensures that all required tables and columns exist in the database.
 * Run this script manually after database resets or automatically on application startup.
 */

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client (for manual execution)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Main migration function
 * @param {Object} customSupabase - Optional Supabase client (for use within application)
 * @returns {Object} - Migration results
 */
export async function migrateDatabase(customSupabase = null) {
  // Use provided Supabase client or the default one
  const client = customSupabase || supabase;
  
  console.log('Starting database migration...');
  const results = {
    success: true,
    operations: [],
    errors: []
  };

  try {
    // Ensure discussion_posts table exists
    await ensureDiscussionPostsTable(client, results);
    
    // Ensure discussion_comments table exists
    await ensureDiscussionCommentsTable(client, results);
    
    // Ensure user_profiles table has required columns
    await ensureUserProfilesTable(client, results);
    
    // Ensure counseling_sessions table has required columns
    await ensureCounselingSessionsTable(client, results);
    
    // Ensure mental_health_checkins table has required columns
    await ensureMentalHealthCheckinsTable(client, results);
    
    console.log('Database migration completed successfully');
    return results;
  } catch (error) {
    console.error('Database migration failed:', error);
    results.success = false;
    results.errors.push({
      operation: 'migration',
      error: error.message
    });
    return results;
  }
}

/**
 * Ensure the discussion_posts table exists with all required columns
 */
async function ensureDiscussionPostsTable(client, results) {
  try {
    // Check if table exists
    const { data: tableExists, error: tableError } = await client.rpc('exec_sql', {
      sql: `
        SELECT EXISTS (
          SELECT FROM pg_tables
          WHERE schemaname = 'public'
          AND tablename = 'discussion_posts'
        );
      `
    });
    
    if (tableError) throw new Error(`Error checking discussion_posts table: ${tableError.message}`);
    
    const exists = tableExists && tableExists.length > 0 && tableExists[0].exists;
    
    // Create table if it doesn't exist
    if (!exists) {
      const { error: createError } = await client.rpc('exec_sql', {
        sql: `
          CREATE TABLE public.discussion_posts (
            id SERIAL PRIMARY KEY,
            user_id UUID,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `
      });
      
      if (createError) throw new Error(`Error creating discussion_posts table: ${createError.message}`);
      
      results.operations.push({
        table: 'discussion_posts',
        operation: 'create_table',
        status: 'success'
      });
    }
    
    // Ensure required columns exist
    const requiredColumns = [
      { name: 'is_approved', type: 'BOOLEAN', default: 'FALSE' },
      { name: 'approved_by', type: 'UUID', default: null },
      { name: 'approved_at', type: 'TIMESTAMP WITH TIME ZONE', default: null },
      { name: 'is_flagged', type: 'BOOLEAN', default: 'FALSE' },
      { name: 'report_count', type: 'INTEGER', default: '0' },
      { name: 'is_pinned', type: 'BOOLEAN', default: 'FALSE' },
      { name: 'pinned_by', type: 'UUID', default: null },
      { name: 'pinned_at', type: 'TIMESTAMP WITH TIME ZONE', default: null },
      { name: 'is_removed', type: 'BOOLEAN', default: 'FALSE' },
      { name: 'removed_by', type: 'UUID', default: null },
      { name: 'removed_at', type: 'TIMESTAMP WITH TIME ZONE', default: null }
    ];
    
    for (const column of requiredColumns) {
      await ensureColumnExists(client, 'discussion_posts', column, results);
    }
    
    return true;
  } catch (error) {
    console.error('Error ensuring discussion_posts table:', error);
    results.errors.push({
      table: 'discussion_posts',
      operation: 'ensure_table',
      error: error.message
    });
    return false;
  }
}

/**
 * Ensure the discussion_comments table exists with all required columns
 */
async function ensureDiscussionCommentsTable(client, results) {
  try {
    // Check if table exists
    const { data: tableExists, error: tableError } = await client.rpc('exec_sql', {
      sql: `
        SELECT EXISTS (
          SELECT FROM pg_tables
          WHERE schemaname = 'public'
          AND tablename = 'discussion_comments'
        );
      `
    });
    
    if (tableError) throw new Error(`Error checking discussion_comments table: ${tableError.message}`);
    
    const exists = tableExists && tableExists.length > 0 && tableExists[0].exists;
    
    // Create table if it doesn't exist
    if (!exists) {
      const { error: createError } = await client.rpc('exec_sql', {
        sql: `
          CREATE TABLE public.discussion_comments (
            id SERIAL PRIMARY KEY,
            post_id INTEGER REFERENCES public.discussion_posts(id) ON DELETE CASCADE,
            user_id UUID,
            content TEXT NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `
      });
      
      if (createError) throw new Error(`Error creating discussion_comments table: ${createError.message}`);
      
      results.operations.push({
        table: 'discussion_comments',
        operation: 'create_table',
        status: 'success'
      });
    }
    
    // Ensure required columns exist
    const requiredColumns = [
      { name: 'is_flagged', type: 'BOOLEAN', default: 'FALSE' },
      { name: 'report_count', type: 'INTEGER', default: '0' },
      { name: 'is_removed', type: 'BOOLEAN', default: 'FALSE' },
      { name: 'removed_by', type: 'UUID', default: null },
      { name: 'removed_at', type: 'TIMESTAMP WITH TIME ZONE', default: null }
    ];
    
    for (const column of requiredColumns) {
      await ensureColumnExists(client, 'discussion_comments', column, results);
    }
    
    return true;
  } catch (error) {
    console.error('Error ensuring discussion_comments table:', error);
    results.errors.push({
      table: 'discussion_comments',
      operation: 'ensure_table',
      error: error.message
    });
    return false;
  }
}

/**
 * Ensure the user_profiles table has all required columns
 */
async function ensureUserProfilesTable(client, results) {
  try {
    // Check if table exists
    const { data: tableExists, error: tableError } = await client.rpc('exec_sql', {
      sql: `
        SELECT EXISTS (
          SELECT FROM pg_tables
          WHERE schemaname = 'public'
          AND tablename = 'user_profiles'
        );
      `
    });
    
    if (tableError) throw new Error(`Error checking user_profiles table: ${tableError.message}`);
    
    const exists = tableExists && tableExists.length > 0 && tableExists[0].exists;
    
    // Create table if it doesn't exist
    if (!exists) {
      const { error: createError } = await client.rpc('exec_sql', {
        sql: `
          CREATE TABLE public.user_profiles (
            id UUID PRIMARY KEY,
            display_name TEXT,
            bio TEXT,
            image_url TEXT,
            role TEXT DEFAULT 'user',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `
      });
      
      if (createError) throw new Error(`Error creating user_profiles table: ${createError.message}`);
      
      results.operations.push({
        table: 'user_profiles',
        operation: 'create_table',
        status: 'success'
      });
    }
    
    // Ensure required columns exist
    const requiredColumns = [
      { name: 'interests', type: 'TEXT[]', default: null },
      { name: 'preferences', type: 'JSONB', default: null },
      { name: 'comfort_level_sharing', type: 'TEXT', default: null }
    ];
    
    for (const column of requiredColumns) {
      await ensureColumnExists(client, 'user_profiles', column, results);
    }
    
    return true;
  } catch (error) {
    console.error('Error ensuring user_profiles table:', error);
    results.errors.push({
      table: 'user_profiles',
      operation: 'ensure_table',
      error: error.message
    });
    return false;
  }
}

/**
 * Ensure the counseling_sessions table has all required columns
 */
async function ensureCounselingSessionsTable(client, results) {
  try {
    // Check if table exists
    const { data: tableExists, error: tableError } = await client.rpc('exec_sql', {
      sql: `
        SELECT EXISTS (
          SELECT FROM pg_tables
          WHERE schemaname = 'public'
          AND tablename = 'counseling_sessions'
        );
      `
    });
    
    if (tableError) throw new Error(`Error checking counseling_sessions table: ${tableError.message}`);
    
    const exists = tableExists && tableExists.length > 0 && tableExists[0].exists;
    
    // Create table if it doesn't exist
    if (!exists) {
      const { error: createError } = await client.rpc('exec_sql', {
        sql: `
          CREATE TABLE public.counseling_sessions (
            id SERIAL PRIMARY KEY,
            counselor_id UUID,
            patient_id UUID,
            scheduled_at TIMESTAMP WITH TIME ZONE,
            duration_minutes INTEGER DEFAULT 60,
            status TEXT DEFAULT 'scheduled',
            notes TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `
      });
      
      if (createError) throw new Error(`Error creating counseling_sessions table: ${createError.message}`);
      
      results.operations.push({
        table: 'counseling_sessions',
        operation: 'create_table',
        status: 'success'
      });
    }
    
    // Ensure required columns exist
    const requiredColumns = [
      { name: 'video_enabled', type: 'BOOLEAN', default: 'FALSE' },
      { name: 'video_room_id', type: 'TEXT', default: null },
      { name: 'video_join_url', type: 'TEXT', default: null }
    ];
    
    for (const column of requiredColumns) {
      await ensureColumnExists(client, 'counseling_sessions', column, results);
    }
    
    return true;
  } catch (error) {
    console.error('Error ensuring counseling_sessions table:', error);
    results.errors.push({
      table: 'counseling_sessions',
      operation: 'ensure_table',
      error: error.message
    });
    return false;
  }
}

/**
 * Ensure the mental_health_checkins table has all required columns
 */
async function ensureMentalHealthCheckinsTable(client, results) {
  try {
    // Check if table exists
    const { data: tableExists, error: tableError } = await client.rpc('exec_sql', {
      sql: `
        SELECT EXISTS (
          SELECT FROM pg_tables
          WHERE schemaname = 'public'
          AND tablename = 'mental_health_checkins'
        );
      `
    });
    
    if (tableError) throw new Error(`Error checking mental_health_checkins table: ${tableError.message}`);
    
    const exists = tableExists && tableExists.length > 0 && tableExists[0].exists;
    
    // Create table if it doesn't exist
    if (!exists) {
      const { error: createError } = await client.rpc('exec_sql', {
        sql: `
          CREATE TABLE public.mental_health_checkins (
            id SERIAL PRIMARY KEY,
            user_id UUID,
            mood_rating INTEGER,
            notes TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `
      });
      
      if (createError) throw new Error(`Error creating mental_health_checkins table: ${createError.message}`);
      
      results.operations.push({
        table: 'mental_health_checkins',
        operation: 'create_table',
        status: 'success'
      });
    }
    
    // Ensure required columns exist
    const requiredColumns = [
      { name: 'sleep_hours', type: 'INTEGER', default: null },
      { name: 'stress_level', type: 'INTEGER', default: null },
      { name: 'anxiety_level', type: 'INTEGER', default: null }
    ];
    
    for (const column of requiredColumns) {
      await ensureColumnExists(client, 'mental_health_checkins', column, results);
    }
    
    return true;
  } catch (error) {
    console.error('Error ensuring mental_health_checkins table:', error);
    results.errors.push({
      table: 'mental_health_checkins',
      operation: 'ensure_table',
      error: error.message
    });
    return false;
  }
}

/**
 * Helper function to ensure a column exists in a table
 */
async function ensureColumnExists(client, tableName, column, results) {
  try {
    // Check if column exists
    const { data: columnExists, error: columnError } = await client.rpc('exec_sql', {
      sql: `
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'public'
          AND table_name = '${tableName}'
          AND column_name = '${column.name}'
        );
      `
    });
    
    if (columnError) throw new Error(`Error checking column ${column.name}: ${columnError.message}`);
    
    const exists = columnExists && columnExists.length > 0 && columnExists[0].exists;
    
    // Add column if it doesn't exist
    if (!exists) {
      let defaultValue = '';
      if (column.default !== null) {
        defaultValue = ` DEFAULT ${column.default}`;
      }
      
      const { error: addError } = await client.rpc('exec_sql', {
        sql: `
          ALTER TABLE public.${tableName}
          ADD COLUMN ${column.name} ${column.type}${defaultValue};
        `
      });
      
      if (addError) throw new Error(`Error adding column ${column.name}: ${addError.message}`);
      
      results.operations.push({
        table: tableName,
        column: column.name,
        operation: 'add_column',
        status: 'success'
      });
    }
    
    return true;
  } catch (error) {
    console.error(`Error ensuring column ${column.name} in ${tableName}:`, error);
    results.errors.push({
      table: tableName,
      column: column.name,
      operation: 'ensure_column',
      error: error.message
    });
    return false;
  }
}

// Execute migration if this script is run directly
if (typeof window === 'undefined' && require.main === module) {
  migrateDatabase()
    .then(results => {
      console.log('Migration results:', JSON.stringify(results, null, 2));
      process.exit(results.success ? 0 : 1);
    })
    .catch(error => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}
