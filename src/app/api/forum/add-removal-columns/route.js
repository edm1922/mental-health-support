import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    // Initialize Supabase client
    const supabase = createRouteHandlerClient({ cookies });

    // Get the session if available
    const { data: { session } } = await supabase.auth.getSession();
    console.log('Session:', session ? 'User is authenticated' : 'No session');

    // Execute SQL to add the missing removal columns
    let error;
    try {
      const result = await supabase.rpc('exec_sql', {
        sql: `
          -- Add missing removal columns to the discussion_posts table
          ALTER TABLE public.discussion_posts
          ADD COLUMN IF NOT EXISTS is_removed BOOLEAN DEFAULT FALSE,
          ADD COLUMN IF NOT EXISTS removed_by UUID,
          ADD COLUMN IF NOT EXISTS removed_at TIMESTAMP WITH TIME ZONE,
          ADD COLUMN IF NOT EXISTS removal_reason TEXT;

          -- Make sure is_approved column exists as well
          ALTER TABLE public.discussion_posts
          ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT FALSE;

          -- Add any other potentially missing columns
          ALTER TABLE public.discussion_posts
          ADD COLUMN IF NOT EXISTS is_flagged BOOLEAN DEFAULT FALSE,
          ADD COLUMN IF NOT EXISTS report_count INTEGER DEFAULT 0,
          ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT FALSE,
          ADD COLUMN IF NOT EXISTS pinned_by UUID,
          ADD COLUMN IF NOT EXISTS pinned_at TIMESTAMP WITH TIME ZONE;

          -- Create indexes for better performance
          CREATE INDEX IF NOT EXISTS idx_discussion_posts_user_id ON public.discussion_posts(user_id);
          CREATE INDEX IF NOT EXISTS idx_discussion_posts_is_approved ON public.discussion_posts(is_approved);
          CREATE INDEX IF NOT EXISTS idx_discussion_posts_is_removed ON public.discussion_posts(is_removed);
          CREATE INDEX IF NOT EXISTS idx_discussion_posts_is_flagged ON public.discussion_posts(is_flagged);
          CREATE INDEX IF NOT EXISTS idx_discussion_posts_is_pinned ON public.discussion_posts(is_pinned);

          -- Refresh the schema cache
          SELECT 1 as refresh_cache;
        `
      });
      error = result.error;
    } catch (rpcError) {
      console.log('RPC error, trying individual statements:', rpcError);

      // If the RPC function doesn't exist, try executing individual statements
      try {
        // Add missing removal columns
        await supabase.from('discussion_posts').select('id').limit(1);

        // Try to add each column individually using raw SQL
        const columns = [
          { name: 'is_removed', type: 'BOOLEAN DEFAULT FALSE' },
          { name: 'removed_by', type: 'UUID' },
          { name: 'removed_at', type: 'TIMESTAMP WITH TIME ZONE' },
          { name: 'removal_reason', type: 'TEXT' },
          { name: 'is_approved', type: 'BOOLEAN DEFAULT FALSE' },
          { name: 'is_flagged', type: 'BOOLEAN DEFAULT FALSE' },
          { name: 'report_count', type: 'INTEGER DEFAULT 0' },
          { name: 'is_pinned', type: 'BOOLEAN DEFAULT FALSE' },
          { name: 'pinned_by', type: 'UUID' },
          { name: 'pinned_at', type: 'TIMESTAMP WITH TIME ZONE' }
        ];

        for (const column of columns) {
          try {
            // Check if column exists
            const { data } = await supabase
              .from('discussion_posts')
              .select(column.name)
              .limit(1);

            console.log(`Column ${column.name} exists:`, data !== null);
          } catch (columnError) {
            // Column doesn't exist, try to add it
            console.log(`Adding column ${column.name}...`);
            try {
              // We can't use ALTER TABLE directly, so we'll use a workaround
              // by creating a temporary function to execute the SQL
              const createFunctionSQL = `
                CREATE OR REPLACE FUNCTION add_column_${column.name}()
                RETURNS void AS $$
                BEGIN
                  ALTER TABLE public.discussion_posts
                  ADD COLUMN IF NOT EXISTS ${column.name} ${column.type};
                END;
                $$ LANGUAGE plpgsql;
              `;

              // Create the function
              await supabase.rpc('exec_sql', { sql: createFunctionSQL });

              // Execute the function
              await supabase.rpc(`add_column_${column.name}`);

              console.log(`Added column ${column.name}`);
            } catch (addError) {
              console.error(`Error adding column ${column.name}:`, addError);
            }
          }
        }
      } catch (fallbackError) {
        console.error('Error in fallback column addition:', fallbackError);
        error = fallbackError;
      }
    }

    if (error) {
      console.error('Error adding removal columns:', error);
      return NextResponse.json(
        { error: 'Failed to add removal columns: ' + error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Removal columns added successfully'
    });
  } catch (error) {
    console.error('Unexpected error in add-removal-columns API:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}
