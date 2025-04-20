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

    // Check if the column exists in the information schema
    const { data: columnCheck, error: columnCheckError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'discussion_posts' 
        AND column_name = 'is_approved';
      `
    });

    if (columnCheckError) {
      console.error('Error checking column existence in information schema:', columnCheckError);
      return NextResponse.json(
        { error: 'Failed to check column existence in information schema: ' + columnCheckError.message },
        { status: 500 }
      );
    }

    const columnExistsInSchema = columnCheck && columnCheck.length > 0;

    // Try to query the column directly
    const { data: queryResult, error: queryError } = await supabase
      .from('discussion_posts')
      .select('id, is_approved')
      .limit(1);

    // Check if the query was successful
    const columnWorksInQuery = !queryError;

    // Get all columns from the discussion_posts table
    const { data: allColumns, error: allColumnsError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT column_name, data_type
        FROM information_schema.columns 
        WHERE table_name = 'discussion_posts';
      `
    });

    return NextResponse.json({
      success: true,
      columnExistsInSchema,
      columnWorksInQuery,
      queryError: queryError ? queryError.message : null,
      allColumns: allColumns || [],
      allColumnsError: allColumnsError ? allColumnsError.message : null
    });
  } catch (error) {
    console.error('Unexpected error in verify-schema API:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}
