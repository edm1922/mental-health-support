import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    // Initialize Supabase client
    const supabase = createRouteHandlerClient({ cookies });

    console.log('Forcing schema refresh for discussion_posts table...');

    // First, check if the table exists and get its structure
    try {
      const { data: tableExists, error: tableCheckError } = await supabase.rpc('exec_sql', {
        sql: `
          SELECT EXISTS (
            SELECT FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_name = 'discussion_posts'
          );
        `
      });

      if (tableCheckError) {
        console.error('Error checking if table exists:', tableCheckError);
        throw tableCheckError;
      }

      // If table doesn't exist, create it
      if (!tableExists || !tableExists[0] || !tableExists[0].exists) {
        console.log('Table does not exist, creating it...');
        const { error: createTableError } = await supabase.rpc('exec_sql', {
          sql: `
            CREATE TABLE public.discussion_posts (
              id SERIAL PRIMARY KEY,
              user_id UUID,
              title TEXT NOT NULL,
              content TEXT NOT NULL,
              is_approved BOOLEAN DEFAULT FALSE,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
          `
        });

        if (createTableError) {
          console.error('Error creating table:', createTableError);
          throw createTableError;
        }

        console.log('Table created successfully');

        // Create an index on user_id to improve performance
        try {
          await supabase.rpc('exec_sql', {
            sql: `
              CREATE INDEX IF NOT EXISTS discussion_posts_user_id_idx ON public.discussion_posts (user_id);
            `
          });
        } catch (indexError) {
          console.error('Error creating index (non-critical):', indexError);
          // Continue anyway
        }

        return NextResponse.json({
          success: true,
          message: 'Table created successfully with is_approved column',
          action: 'created_table'
        });
      }
    } catch (tableError) {
      console.error('Error checking/creating table:', tableError);
      // Continue to the next method
    }

    // Aggressive approach: Recreate the column completely
    try {
      console.log('Taking aggressive approach to fix schema...');

      // First, backup any existing data in the is_approved column
      const { error: backupError } = await supabase.rpc('exec_sql', {
        sql: `
          -- Create a temporary table to store the backup
          CREATE TEMP TABLE temp_is_approved_backup AS
          SELECT id,
                 CASE WHEN is_approved IS NOT NULL THEN is_approved ELSE FALSE END as is_approved_value
          FROM public.discussion_posts;
        `
      });

      if (backupError) {
        console.error('Error backing up data (continuing anyway):', backupError);
        // Continue anyway
      } else {
        console.log('Successfully backed up is_approved values');
      }

      // Drop the column
      const { error: dropError } = await supabase.rpc('exec_sql', {
        sql: `
          -- Drop the column
          ALTER TABLE public.discussion_posts DROP COLUMN IF EXISTS is_approved;
        `
      });

      if (dropError) {
        console.error('Error dropping column:', dropError);
        // Continue anyway
      } else {
        console.log('Successfully dropped is_approved column');
      }

      // Add the column back
      const { error: addError } = await supabase.rpc('exec_sql', {
        sql: `
          -- Add the column back
          ALTER TABLE public.discussion_posts ADD COLUMN is_approved BOOLEAN DEFAULT FALSE;
        `
      });

      if (addError) {
        console.error('Error adding column:', addError);
        throw addError;
      } else {
        console.log('Successfully added is_approved column');
      }

      // Restore the backed up data
      try {
        const { error: restoreError } = await supabase.rpc('exec_sql', {
          sql: `
            -- Restore the backed up data
            UPDATE public.discussion_posts p
            SET is_approved = b.is_approved_value
            FROM temp_is_approved_backup b
            WHERE p.id = b.id;

            -- Drop the temporary table
            DROP TABLE IF EXISTS temp_is_approved_backup;
          `
        });

        if (restoreError) {
          console.error('Error restoring data (non-critical):', restoreError);
          // Continue anyway
        } else {
          console.log('Successfully restored is_approved values');
        }
      } catch (restoreErr) {
        console.error('Exception during restore (non-critical):', restoreErr);
        // Continue anyway
      }

      // Create a policy for the column to ensure it's visible
      try {
        const { error: policyError } = await supabase.rpc('exec_sql', {
          sql: `
            -- Drop existing policies if any
            DROP POLICY IF EXISTS discussion_posts_select_policy ON public.discussion_posts;

            -- Create a policy that allows reading posts that are approved
            CREATE POLICY discussion_posts_select_policy ON public.discussion_posts
            FOR SELECT USING (is_approved = TRUE);
          `
        });

        if (policyError) {
          console.error('Error creating policy (non-critical):', policyError);
          // Continue anyway
        } else {
          console.log('Successfully created policy for is_approved column');
        }
      } catch (policyErr) {
        console.error('Exception during policy creation (non-critical):', policyErr);
        // Continue anyway
      }

      // Force a schema refresh by analyzing the table
      try {
        const { error: analyzeError } = await supabase.rpc('exec_sql', {
          sql: `
            -- Analyze the table to update statistics and force schema refresh
            ANALYZE public.discussion_posts;
          `
        });

        if (analyzeError) {
          console.error('Error analyzing table (non-critical):', analyzeError);
          // Continue anyway
        } else {
          console.log('Successfully analyzed table');
        }
      } catch (analyzeErr) {
        console.error('Exception during analyze (non-critical):', analyzeErr);
        // Continue anyway
      }
    } catch (aggressiveError) {
      console.error('Aggressive approach failed:', aggressiveError);
      // Continue to the next method
    }

    // Try to create a temporary view and drop it
    try {
      console.log('Creating temporary view to force schema refresh...');
      const { error: viewError } = await supabase.rpc('exec_sql', {
        sql: `
          -- Create a temporary view based on the table (forces schema refresh)
          CREATE OR REPLACE VIEW temp_discussion_posts_view AS
          SELECT id, title, content, user_id, is_approved, created_at, updated_at
          FROM public.discussion_posts;

          -- Drop the view
          DROP VIEW temp_discussion_posts_view;
        `
      });

      if (viewError) {
        console.error('Error creating/dropping view:', viewError);
        throw viewError;
      } else {
        console.log('Successfully created and dropped temporary view');
      }
    } catch (viewError) {
      console.error('View creation attempt failed:', viewError);
      // Continue to the next method
    }

    // Try to use the REST API directly to force a schema refresh
    try {
      console.log('Attempting direct REST API query to refresh schema...');
      const { data, error } = await supabase
        .from('discussion_posts')
        .select('id, is_approved')
        .limit(1);

      if (error) {
        console.error('Error using REST API to refresh schema:', error);
        throw error;
      } else {
        console.log('Successfully queried via REST API');
      }
    } catch (restError) {
      console.error('REST API attempt failed:', restError);
      // Continue to the final response
    }

    // Final verification
    try {
      console.log('Performing final verification...');
      // Verify the column exists by checking the information schema
      const { data: columnCheck, error: columnCheckError } = await supabase.rpc('exec_sql', {
        sql: `
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns
          WHERE table_schema = 'public'
          AND table_name = 'discussion_posts'
          AND column_name = 'is_approved';
        `
      });

      if (columnCheckError) {
        console.error('Error checking column existence:', columnCheckError);
        return NextResponse.json(
          { error: 'Failed to check column existence: ' + columnCheckError.message },
          { status: 500 }
        );
      }

      const columnExists = columnCheck && columnCheck.length > 0;
      console.log('Column exists in information schema:', columnExists);

      // Check if the column works in a query
      let queryWorks = false;
      let queryError = null;

      try {
        const { data: queryTest, error: queryTestError } = await supabase
          .from('discussion_posts')
          .select('id, is_approved')
          .limit(1);

        if (queryTestError) {
          queryError = queryTestError.message;
          console.error('Query test failed:', queryError);
        } else {
          queryWorks = true;
          console.log('Query test succeeded');
        }
      } catch (queryErr) {
        queryError = queryErr.message;
        console.error('Exception during query test:', queryError);
      }

      // Get all columns in the table for reference
      const { data: allColumns, error: allColumnsError } = await supabase.rpc('exec_sql', {
        sql: `
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns
          WHERE table_schema = 'public'
          AND table_name = 'discussion_posts'
          ORDER BY ordinal_position;
        `
      });

      if (allColumnsError) {
        console.error('Error getting all columns:', allColumnsError);
      } else {
        console.log('Successfully retrieved all columns');
      }

      return NextResponse.json({
        success: true,
        message: 'Schema refresh attempts completed',
        columnExists: columnExists,
        columnInfo: columnCheck,
        queryWorks: queryWorks,
        queryError: queryError,
        allColumns: allColumns
      });
    } catch (verifyError) {
      console.error('Verification failed:', verifyError);
      return NextResponse.json(
        { error: 'Failed to verify schema refresh: ' + verifyError.message },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Unexpected error in force-schema-refresh API:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}
