import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Initialize Supabase client
    const supabase = createRouteHandlerClient({ cookies });

    // Get the session if available
    const { data: { session } } = await supabase.auth.getSession();
    console.log('Session:', session ? 'User is authenticated' : 'No session');

    // Check if the discussion_posts table exists
    const { data: postsData, error: postsError } = await supabase
      .from('discussion_posts')
      .select('id')
      .limit(1);

    // Check if the is_approved column exists
    let hasApprovedColumn = false;
    try {
      const { data: columnData, error: columnError } = await supabase
        .from('discussion_posts')
        .select('is_approved')
        .limit(1);
      
      hasApprovedColumn = !columnError;
    } catch (err) {
      console.log('Error checking for is_approved column:', err);
    }

    // Get all tables in the database
    const { data: tablesData, error: tablesError } = await supabase
      .from('pg_tables')
      .select('tablename')
      .eq('schemaname', 'public');

    const tables = tablesError ? [] : (tablesData || []).map(t => t.tablename);

    return NextResponse.json({
      success: true,
      schema: {
        discussion_posts_exists: !postsError,
        has_approved_column: hasApprovedColumn,
        tables: tables
      }
    });
  } catch (error) {
    console.error('Unexpected error in check-schema API:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}
