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

    // Force a schema refresh by making a simple query
    const { data, error } = await supabase
      .from('discussion_posts')
      .select('id, is_approved')
      .limit(1);

    if (error) {
      console.error('Error refreshing schema cache:', error);
      
      // Try to execute a direct SQL query to refresh the schema cache
      const { error: sqlError } = await supabase.rpc('exec_sql', {
        sql: `
          -- This query forces Supabase to refresh its schema cache
          SELECT id, is_approved FROM public.discussion_posts LIMIT 1;
        `
      });

      if (sqlError) {
        console.error('Error executing SQL to refresh schema:', sqlError);
        return NextResponse.json(
          { error: 'Failed to refresh schema cache: ' + sqlError.message },
          { status: 500 }
        );
      }
    }

    // Verify the column exists by checking the information schema
    const { data: columnCheck, error: columnCheckError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'discussion_posts' 
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

    // If column doesn't exist in information schema (which would be strange at this point)
    if (!columnCheck || columnCheck.length === 0) {
      return NextResponse.json(
        { error: 'Column is_approved does not exist in the database schema' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Schema cache refreshed successfully',
      columnExists: true
    });
  } catch (error) {
    console.error('Unexpected error in refresh-schema-cache API:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}
