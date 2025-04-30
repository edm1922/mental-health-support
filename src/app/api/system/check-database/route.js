import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { migrateDatabase } from '@/scripts/migrate-database';

export const dynamic = 'force-dynamic';

/**
 * API endpoint to check and fix database schema
 * This can be called on application startup or manually when needed
 */
export async function POST(request) {
  try {
    // Initialize Supabase client
    const supabase = createRouteHandlerClient({ cookies });

    // Get the session if available (not required for this operation)
    const { data: { session } } = await supabase.auth.getSession();
    const isAdmin = session?.user ? await checkAdminStatus(supabase, session.user.id) : false;

    // Only allow admins to run full migrations
    const requestData = await request.json();
    const runMigration = requestData?.runMigration === true && isAdmin;
    
    if (runMigration) {
      console.log('Running full database migration...');
      const migrationResults = await migrateDatabase(supabase);
      
      return NextResponse.json({
        success: migrationResults.success,
        message: migrationResults.success ? 'Database migration completed successfully' : 'Database migration failed',
        operations: migrationResults.operations,
        errors: migrationResults.errors
      });
    } else {
      // Just check critical tables and columns
      console.log('Checking critical database schema...');
      const schemaStatus = await checkCriticalSchema(supabase);
      
      return NextResponse.json({
        success: true,
        schemaStatus
      });
    }
  } catch (error) {
    console.error('Error in check-database API:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error: ' + error.message 
      },
      { status: 500 }
    );
  }
}

/**
 * Check if a user is an admin
 */
async function checkAdminStatus(supabase, userId) {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', userId)
      .single();
      
    if (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
    
    return data?.role === 'admin';
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

/**
 * Check critical schema components
 */
async function checkCriticalSchema(supabase) {
  const results = {
    tables: {},
    criticalIssuesFound: false
  };
  
  // Check discussion_posts table and is_approved column
  const discussionPostsStatus = await checkDiscussionPostsTable(supabase);
  results.tables.discussion_posts = discussionPostsStatus;
  
  if (!discussionPostsStatus.exists || !discussionPostsStatus.columns.is_approved) {
    results.criticalIssuesFound = true;
  }
  
  // Check user_profiles table
  const userProfilesStatus = await checkUserProfilesTable(supabase);
  results.tables.user_profiles = userProfilesStatus;
  
  if (!userProfilesStatus.exists) {
    results.criticalIssuesFound = true;
  }
  
  return results;
}

/**
 * Check discussion_posts table and its columns
 */
async function checkDiscussionPostsTable(supabase) {
  try {
    // Check if table exists
    const { data: tableExists, error: tableError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT EXISTS (
          SELECT FROM pg_tables
          WHERE schemaname = 'public'
          AND tablename = 'discussion_posts'
        );
      `
    });
    
    if (tableError) {
      console.error('Error checking discussion_posts table:', tableError);
      return { exists: false, error: tableError.message };
    }
    
    const exists = tableExists && tableExists.length > 0 && tableExists[0].exists;
    
    if (!exists) {
      return { exists: false };
    }
    
    // Check critical columns
    const columnsToCheck = ['is_approved', 'user_id', 'title', 'content'];
    const columnStatus = {};
    
    for (const column of columnsToCheck) {
      const { data: columnExists, error: columnError } = await supabase.rpc('exec_sql', {
        sql: `
          SELECT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public'
            AND table_name = 'discussion_posts'
            AND column_name = '${column}'
          );
        `
      });
      
      if (columnError) {
        console.error(`Error checking column ${column}:`, columnError);
        columnStatus[column] = false;
      } else {
        columnStatus[column] = columnExists && columnExists.length > 0 && columnExists[0].exists;
      }
    }
    
    return {
      exists: true,
      columns: columnStatus
    };
  } catch (error) {
    console.error('Error checking discussion_posts table:', error);
    return { exists: false, error: error.message };
  }
}

/**
 * Check user_profiles table
 */
async function checkUserProfilesTable(supabase) {
  try {
    // Check if table exists
    const { data: tableExists, error: tableError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT EXISTS (
          SELECT FROM pg_tables
          WHERE schemaname = 'public'
          AND tablename = 'user_profiles'
        );
      `
    });
    
    if (tableError) {
      console.error('Error checking user_profiles table:', tableError);
      return { exists: false, error: tableError.message };
    }
    
    const exists = tableExists && tableExists.length > 0 && tableExists[0].exists;
    
    if (!exists) {
      return { exists: false };
    }
    
    // Check critical columns
    const columnsToCheck = ['id', 'display_name', 'role'];
    const columnStatus = {};
    
    for (const column of columnsToCheck) {
      const { data: columnExists, error: columnError } = await supabase.rpc('exec_sql', {
        sql: `
          SELECT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public'
            AND table_name = 'user_profiles'
            AND column_name = '${column}'
          );
        `
      });
      
      if (columnError) {
        console.error(`Error checking column ${column}:`, columnError);
        columnStatus[column] = false;
      } else {
        columnStatus[column] = columnExists && columnExists.length > 0 && columnExists[0].exists;
      }
    }
    
    return {
      exists: true,
      columns: columnStatus
    };
  } catch (error) {
    console.error('Error checking user_profiles table:', error);
    return { exists: false, error: error.message };
  }
}
