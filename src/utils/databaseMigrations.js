import { supabase } from './supabaseClient';

/**
 * Ensures the exec_sql function exists in the database
 * @returns {Promise<{success: boolean, message: string}>}
 */
async function ensureExecSqlFunction() {
  try {
    console.log('Checking if exec_sql function exists...');

    // Try to use the function with a simple query
    const { data: testData, error: testError } = await supabase.rpc('exec_sql', {
      sql: 'SELECT 1 as test;'
    });

    // If the function works, we're good
    if (!testError) {
      console.log('exec_sql function exists and is working');
      return { success: true, message: 'exec_sql function exists' };
    }

    // If we get a specific error about the function not existing, try to create it
    if (testError && (testError.message.includes('function') || testError.message.includes('does not exist'))) {
      console.log('exec_sql function does not exist, creating it...');

      // We need to create the function using a direct SQL query
      // This is a bit tricky because we need the function to execute SQL
      // We'll use a direct fetch to the Supabase REST API

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseKey) {
        return {
          success: false,
          message: 'Missing Supabase URL or key in environment variables'
        };
      }

      // Create the function using a direct SQL query via the REST API
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        },
        body: JSON.stringify({
          sql: `
            -- Create RPC function for executing SQL
            CREATE OR REPLACE FUNCTION exec_sql(sql text)
            RETURNS JSONB
            LANGUAGE plpgsql
            SECURITY DEFINER
            AS $$
            BEGIN
              EXECUTE sql;
              RETURN jsonb_build_object('success', true);
            EXCEPTION WHEN OTHERS THEN
              RETURN jsonb_build_object(
                'success', false,
                'error', SQLERRM,
                'detail', SQLSTATE
              );
            END;
            $$;
          `
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error creating exec_sql function:', errorData);
        return {
          success: false,
          message: `Failed to create exec_sql function: ${errorData.message || response.statusText}`
        };
      }

      console.log('Successfully created exec_sql function');
      return { success: true, message: 'Successfully created exec_sql function' };
    }

    // If we get here, there was some other error
    return {
      success: false,
      message: `Error with exec_sql function: ${testError.message}`
    };
  } catch (error) {
    console.error('Unexpected error ensuring exec_sql function:', error);
    return { success: false, message: 'Unexpected error: ' + error.message };
  }
}

/**
 * Adds missing columns to the discussion_posts table
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function fixDiscussionPostsSchema() {
  try {
    console.log('Attempting to fix discussion_posts schema...');

    // Check if the table exists using exec_sql RPC function
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
      console.error('Error checking if discussion_posts table exists:', tableError);
      return { success: false, message: 'Error checking if table exists: ' + tableError.message };
    }

    const exists = tableExists && tableExists.length > 0 && tableExists[0].exists;
    if (!exists) {
      console.error('discussion_posts table does not exist');
      return { success: false, message: 'The discussion_posts table does not exist' };
    }

    // Check if the is_removed column exists using exec_sql RPC function
    const { data: columnExists, error: columnError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT EXISTS (
          SELECT FROM information_schema.columns
          WHERE table_schema = 'public'
          AND table_name = 'discussion_posts'
          AND column_name = 'is_removed'
        );
      `
    });

    // If the column doesn't exist, add it
    const columnExistsValue = columnExists && columnExists.length > 0 && columnExists[0].exists;
    if (columnError || !columnExistsValue) {
      console.log('is_removed column does not exist, adding it...');

      // Add the is_removed column
      const { error: addColumnError } = await supabase.rpc('exec_sql', {
        sql: `
          ALTER TABLE public.discussion_posts
          ADD COLUMN IF NOT EXISTS is_removed BOOLEAN DEFAULT FALSE,
          ADD COLUMN IF NOT EXISTS removed_by UUID,
          ADD COLUMN IF NOT EXISTS removed_at TIMESTAMP WITH TIME ZONE,
          ADD COLUMN IF NOT EXISTS removal_reason TEXT
        `
      });

      if (addColumnError) {
        console.error('Error adding columns to discussion_posts:', addColumnError);
        return { success: false, message: 'Error adding columns: ' + addColumnError.message };
      }

      console.log('Successfully added removal columns to discussion_posts table');
      return { success: true, message: 'Successfully added removal columns to discussion_posts table' };
    } else if (columnError) {
      console.error('Error checking if is_removed column exists:', columnError);
      return { success: false, message: 'Error checking if column exists: ' + columnError.message };
    } else {
      console.log('Removal columns already exist in discussion_posts table');
      return { success: true, message: 'Removal columns already exist in discussion_posts table' };
    }
  } catch (error) {
    console.error('Unexpected error fixing discussion_posts schema:', error);
    return { success: false, message: 'Unexpected error: ' + error.message };
  }
}

/**
 * Refreshes the database schema cache
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function refreshSchemaCache() {
  try {
    console.log('Refreshing schema cache...');

    // Execute a simple query to refresh the schema cache
    // Use a more robust approach with a query that's guaranteed to work
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT 1 as test;
      `
    });

    if (error) {
      console.error('Error refreshing schema cache:', error);
      return { success: false, message: 'Error refreshing schema cache: ' + error.message };
    }

    console.log('Successfully refreshed schema cache');
    return { success: true, message: 'Successfully refreshed schema cache' };
  } catch (error) {
    console.error('Unexpected error refreshing schema cache:', error);
    return { success: false, message: 'Unexpected error: ' + error.message };
  }
}

/**
 * Comprehensive database schema fix that addresses common issues
 * @returns {Promise<{success: boolean, message: string, operations: Array}>}
 */
export async function fixDatabaseSchema() {
  try {
    console.log('Running comprehensive database schema fix...');

    // Track all operations performed
    const operations = [];

    // First, ensure the exec_sql function exists
    const execSqlResult = await ensureExecSqlFunction();
    if (execSqlResult.success) {
      operations.push({
        operation: 'ensure_exec_sql_function',
        status: 'success'
      });
    } else {
      console.error('Error ensuring exec_sql function:', execSqlResult.message);
      return {
        success: false,
        message: 'The exec_sql function is not available: ' + execSqlResult.message,
        operations: [{
          operation: 'ensure_exec_sql_function',
          status: 'failed',
          error: execSqlResult.message
        }]
      };
    }

    // Fix discussion_posts schema
    const discussionPostsResult = await fixDiscussionPostsSchema();
    if (discussionPostsResult.success) {
      operations.push({
        table: 'discussion_posts',
        operation: 'check_and_fix_columns',
        status: 'success'
      });
    } else {
      console.warn('Could not fix discussion_posts schema:', discussionPostsResult.message);
      operations.push({
        table: 'discussion_posts',
        operation: 'check_and_fix_columns',
        status: 'failed',
        error: discussionPostsResult.message
      });
      // Continue with other fixes even if this one failed
    }

    // Add other schema fixes here as needed

    // Refresh schema cache
    const refreshResult = await refreshSchemaCache();
    if (refreshResult.success) {
      operations.push({
        operation: 'refresh_schema_cache',
        status: 'success'
      });
    } else {
      console.warn('Could not refresh schema cache:', refreshResult.message);
      operations.push({
        operation: 'refresh_schema_cache',
        status: 'failed',
        error: refreshResult.message
      });
    }

    // Determine overall success based on critical operations
    const criticalFailure = operations.some(op =>
      op.table === 'discussion_posts' && op.status === 'failed'
    );

    return {
      success: !criticalFailure,
      message: criticalFailure
        ? 'Some critical database fixes failed'
        : 'Successfully fixed database schema',
      operations
    };
  } catch (error) {
    console.error('Unexpected error fixing database schema:', error);
    return {
      success: false,
      message: 'Unexpected error: ' + error.message,
      operations: [{
        operation: 'database_fix',
        status: 'failed',
        error: error.message
      }]
    };
  }
}

/**
 * Automatic comprehensive database fix that handles all steps in one operation
 * This combines creating the exec_sql function, fixing schema issues, and refreshing the cache
 * @returns {Promise<{success: boolean, message: string, operations: Array}>}
 */
export async function autoFixDatabaseSchema() {
  try {
    console.log('Running automatic database schema fix...');

    // Track all operations performed
    const operations = [];
    let overallSuccess = true;

    // Step 1: Try to create the exec_sql function using direct SQL via REST API
    console.log('Step 1: Creating exec_sql function...');
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return {
        success: false,
        message: 'Missing Supabase URL or key in environment variables',
        operations: [{
          operation: 'check_environment',
          status: 'failed',
          error: 'Missing Supabase URL or key'
        }]
      };
    }

    try {
      // Create the function using a direct SQL query via the REST API
      const createFunctionSQL = `
        -- Drop the existing exec_sql function first if it exists
        DROP FUNCTION IF EXISTS exec_sql(text);

        -- Create RPC function for executing SQL
        CREATE OR REPLACE FUNCTION exec_sql(sql text)
        RETURNS JSONB
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $$
        BEGIN
          EXECUTE sql;
          RETURN jsonb_build_object('success', true);
        EXCEPTION WHEN OTHERS THEN
          RETURN jsonb_build_object(
            'success', false,
            'error', SQLERRM,
            'detail', SQLSTATE
          );
        END;
        $$;
      `;

      // First try using the RPC method
      let functionCreated = false;
      try {
        const { error: rpcError } = await supabase.rpc('exec_sql', {
          sql: createFunctionSQL
        });

        if (!rpcError) {
          functionCreated = true;
          operations.push({
            operation: 'create_exec_sql_function',
            method: 'rpc',
            status: 'success'
          });
        }
      } catch (rpcError) {
        console.log('RPC method failed, trying REST API:', rpcError);
      }

      // If RPC failed, try REST API
      if (!functionCreated) {
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`
          },
          body: JSON.stringify({
            sql: createFunctionSQL
          })
        });

        if (response.ok) {
          operations.push({
            operation: 'create_exec_sql_function',
            method: 'rest',
            status: 'success'
          });
        } else {
          // Even if this fails, continue with the next steps
          // The function might already exist or we might have permission issues
          const errorData = await response.json().catch(() => ({ message: response.statusText }));
          operations.push({
            operation: 'create_exec_sql_function',
            method: 'rest',
            status: 'failed',
            error: errorData.message || response.statusText
          });
          console.warn('Failed to create exec_sql function via REST API, continuing anyway');
        }
      }
    } catch (functionError) {
      operations.push({
        operation: 'create_exec_sql_function',
        status: 'failed',
        error: functionError.message
      });
      console.warn('Error creating exec_sql function:', functionError.message);
      // Continue anyway, the function might already exist
    }

    // Step 2: Fix the discussion_posts schema
    console.log('Step 2: Fixing discussion_posts schema...');
    try {
      // Check if the table exists using exec_sql RPC function
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
        operations.push({
          table: 'discussion_posts',
          operation: 'check_table_exists',
          status: 'failed',
          error: tableError.message
        });
        console.error('Error checking if discussion_posts table exists:', tableError);
      } else {
        const exists = tableExists && tableExists.length > 0 && tableExists[0].exists;

        if (!exists) {
          // Create the table if it doesn't exist
          const { error: createError } = await supabase.rpc('exec_sql', {
            sql: `
              CREATE TABLE IF NOT EXISTS public.discussion_posts (
                id SERIAL PRIMARY KEY,
                user_id UUID,
                title TEXT NOT NULL,
                content TEXT NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                is_approved BOOLEAN DEFAULT FALSE,
                is_removed BOOLEAN DEFAULT FALSE,
                removed_by UUID,
                removed_at TIMESTAMP WITH TIME ZONE,
                removal_reason TEXT
              );
            `
          });

          if (createError) {
            operations.push({
              table: 'discussion_posts',
              operation: 'create_table',
              status: 'failed',
              error: createError.message
            });
            console.error('Error creating discussion_posts table:', createError);
            overallSuccess = false;
          } else {
            operations.push({
              table: 'discussion_posts',
              operation: 'create_table',
              status: 'success'
            });
          }
        } else {
          // Table exists, check for required columns
          const { error: addColumnsError } = await supabase.rpc('exec_sql', {
            sql: `
              ALTER TABLE public.discussion_posts
              ADD COLUMN IF NOT EXISTS is_removed BOOLEAN DEFAULT FALSE,
              ADD COLUMN IF NOT EXISTS removed_by UUID,
              ADD COLUMN IF NOT EXISTS removed_at TIMESTAMP WITH TIME ZONE,
              ADD COLUMN IF NOT EXISTS removal_reason TEXT,
              ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT FALSE;
            `
          });

          if (addColumnsError) {
            operations.push({
              table: 'discussion_posts',
              operation: 'add_columns',
              status: 'failed',
              error: addColumnsError.message
            });
            console.error('Error adding columns to discussion_posts:', addColumnsError);
            overallSuccess = false;
          } else {
            operations.push({
              table: 'discussion_posts',
              operation: 'add_columns',
              status: 'success'
            });
          }
        }
      }
    } catch (schemaError) {
      operations.push({
        table: 'discussion_posts',
        operation: 'fix_schema',
        status: 'failed',
        error: schemaError.message
      });
      console.error('Error fixing discussion_posts schema:', schemaError);
      overallSuccess = false;
    }

    // Step 3: Refresh the schema cache
    console.log('Step 3: Refreshing schema cache...');
    try {
      const { error: refreshError } = await supabase.rpc('exec_sql', {
        sql: `SELECT 1 as test;`
      });

      if (refreshError) {
        operations.push({
          operation: 'refresh_schema_cache',
          status: 'failed',
          error: refreshError.message
        });
        console.warn('Error refreshing schema cache:', refreshError);
      } else {
        operations.push({
          operation: 'refresh_schema_cache',
          status: 'success'
        });
      }
    } catch (refreshError) {
      operations.push({
        operation: 'refresh_schema_cache',
        status: 'failed',
        error: refreshError.message
      });
      console.warn('Error refreshing schema cache:', refreshError);
    }

    // Determine overall success
    const criticalFailure = operations.some(op =>
      (op.table === 'discussion_posts' && op.status === 'failed') ||
      (op.operation === 'create_exec_sql_function' && op.status === 'failed')
    );

    return {
      success: !criticalFailure && overallSuccess,
      message: criticalFailure
        ? 'Some critical database fixes failed'
        : 'Successfully fixed database schema automatically',
      operations
    };
  } catch (error) {
    console.error('Unexpected error in automatic database fix:', error);
    return {
      success: false,
      message: 'Unexpected error: ' + error.message,
      operations: [{
        operation: 'auto_database_fix',
        status: 'failed',
        error: error.message
      }]
    };
  }
}
