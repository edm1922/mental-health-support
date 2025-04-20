import { supabase } from './supabaseClient';

/**
 * Checks if the database schema has critical issues that need to be fixed
 * @returns {Promise<boolean>} True if issues were detected
 */
export async function checkForDatabaseIssues() {
  try {
    console.log('Checking for database schema issues...');
    
    // First check if the exec_sql function exists
    try {
      const { error: execSqlError } = await supabase.rpc('exec_sql', {
        sql: 'SELECT 1 as test;'
      });
      
      if (execSqlError) {
        console.log('exec_sql function issue detected:', execSqlError.message);
        return true; // Issue detected
      }
    } catch (error) {
      console.log('exec_sql function does not exist:', error.message);
      return true; // Issue detected
    }
    
    // Check if the discussion_posts table exists and has required columns
    try {
      const { data: tableData, error: tableError } = await supabase.rpc('exec_sql', {
        sql: `
          SELECT EXISTS (
            SELECT FROM pg_tables
            WHERE schemaname = 'public'
            AND tablename = 'discussion_posts'
          );
        `
      });
      
      if (tableError) {
        console.log('Error checking discussion_posts table:', tableError.message);
        return true; // Issue detected
      }
      
      const tableExists = tableData && tableData.length > 0 && tableData[0].exists;
      if (!tableExists) {
        console.log('discussion_posts table does not exist');
        return true; // Issue detected
      }
      
      // Check for required columns
      const { data: columnData, error: columnError } = await supabase.rpc('exec_sql', {
        sql: `
          SELECT 
            EXISTS (SELECT FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'discussion_posts' 
                   AND column_name = 'is_removed') as has_is_removed,
            EXISTS (SELECT FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'discussion_posts' 
                   AND column_name = 'is_approved') as has_is_approved;
        `
      });
      
      if (columnError) {
        console.log('Error checking discussion_posts columns:', columnError.message);
        return true; // Issue detected
      }
      
      if (columnData && columnData.length > 0) {
        const { has_is_removed, has_is_approved } = columnData[0];
        if (!has_is_removed || !has_is_approved) {
          console.log('Missing required columns in discussion_posts table');
          return true; // Issue detected
        }
      } else {
        console.log('Could not verify discussion_posts columns');
        return true; // Issue detected
      }
    } catch (error) {
      console.log('Error checking discussion_posts table:', error.message);
      return true; // Issue detected
    }
    
    // No issues detected
    console.log('No database schema issues detected');
    return false;
  } catch (error) {
    console.error('Error checking for database issues:', error);
    return true; // Assume issues if we can't check properly
  }
}

/**
 * Automatically fixes database schema issues if needed
 * @returns {Promise<{fixed: boolean, message: string}>}
 */
export async function autoFixDatabaseIfNeeded() {
  try {
    const hasIssues = await checkForDatabaseIssues();
    
    if (hasIssues) {
      console.log('Database issues detected, running automatic fix...');
      
      // Call the API to fix the issues
      const response = await fetch('/api/system/auto-fix-database', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const result = await response.json();
      
      if (result.success) {
        console.log('Database issues fixed successfully');
        return {
          fixed: true,
          message: 'Database issues fixed successfully'
        };
      } else {
        console.error('Failed to fix database issues:', result.message);
        return {
          fixed: false,
          message: 'Failed to fix database issues: ' + result.message
        };
      }
    } else {
      return {
        fixed: false,
        message: 'No database issues detected'
      };
    }
  } catch (error) {
    console.error('Error in autoFixDatabaseIfNeeded:', error);
    return {
      fixed: false,
      message: 'Error checking/fixing database: ' + error.message
    };
  }
}
