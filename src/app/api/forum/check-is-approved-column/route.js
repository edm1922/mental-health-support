import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Initialize Supabase client
    const supabase = createRouteHandlerClient({ cookies });

    console.log('Checking if is_approved column exists and is recognized...');

    // First, check if the table exists
    const { data: tableExists, error: tableError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name = 'discussion_posts'
        );
      `
    });

    if (tableError) {
      console.error('Error checking if table exists:', tableError);
      return NextResponse.json(
        { error: 'Error checking if table exists: ' + tableError.message },
        { status: 500 }
      );
    }

    const tableExistsFlag = tableExists && tableExists[0] && tableExists[0].exists;

    if (!tableExistsFlag) {
      return NextResponse.json({
        tableExists: false,
        columnExistsInSchema: false,
        columnWorksInQuery: false,
        message: 'The discussion_posts table does not exist'
      });
    }

    // Check if the column exists in the information schema
    const { data: columnInfo, error: columnError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'discussion_posts'
        AND column_name = 'is_approved';
      `
    });

    if (columnError) {
      console.error('Error checking column in information schema:', columnError);
    }

    const columnExists = columnInfo && columnInfo.length > 0;

    // Try to query using the column
    let queryWorks = false;
    let queryError = null;

    try {
      const { data, error } = await supabase
        .from('discussion_posts')
        .select('id, is_approved')
        .limit(1);

      if (error) {
        queryError = error.message;
        console.error('Error querying with is_approved column:', error);
      } else {
        queryWorks = true;
        console.log('Successfully queried with is_approved column');
      }
    } catch (err) {
      queryError = err.message;
      console.error('Exception during query test:', err);
    }

    // Try a direct query using SQL
    let directQueryWorks = false;
    let directQueryError = null;
    let directQueryResult = null;

    try {
      const { data: sqlResult, error: sqlError } = await supabase.rpc('exec_sql', {
        sql: `
          SELECT id, is_approved FROM public.discussion_posts LIMIT 1;
        `
      });

      if (sqlError) {
        directQueryError = sqlError.message;
        console.error('Error with direct SQL query:', sqlError);
      } else {
        directQueryWorks = true;
        directQueryResult = sqlResult;
        console.log('Successfully executed direct SQL query');
      }
    } catch (sqlErr) {
      directQueryError = sqlErr.message;
      console.error('Exception during direct SQL query:', sqlErr);
    }

    // Get all columns in the table for reference
    const { data: allColumns, error: allColumnsError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT column_name, data_type, is_nullable, column_default
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

    // Check if RLS is enabled on the table
    const { data: rlsInfo, error: rlsError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT relrowsecurity
        FROM pg_class
        WHERE oid = 'public.discussion_posts'::regclass;
      `
    });

    let rlsEnabled = false;
    if (rlsError) {
      console.error('Error checking RLS status:', rlsError);
    } else {
      rlsEnabled = rlsInfo && rlsInfo[0] && rlsInfo[0].relrowsecurity;
      console.log('RLS enabled on discussion_posts:', rlsEnabled);
    }

    // Check for policies on the table
    const { data: policies, error: policiesError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT polname, polcmd, polpermissive, polroles, polqual
        FROM pg_policy
        WHERE polrelid = 'public.discussion_posts'::regclass;
      `
    });

    if (policiesError) {
      console.error('Error checking policies:', policiesError);
    } else {
      console.log('Policies on discussion_posts:', policies);
    }

    // Determine overall status
    const status = {
      tableExists: true,
      columnExistsInSchema: columnExists,
      columnWorksInQuery: queryWorks,
      directQueryWorks: directQueryWorks,
      rlsEnabled: rlsEnabled,
      hasPolicies: policies && policies.length > 0,
      overallStatus: columnExists && queryWorks ? 'healthy' : 'issue_detected'
    };

    return NextResponse.json({
      status: status,
      columnExistsInSchema: columnExists,
      columnInfo: columnInfo,
      columnWorksInQuery: queryWorks,
      queryError: queryError,
      directQueryWorks: directQueryWorks,
      directQueryError: directQueryError,
      directQueryResult: directQueryResult,
      allColumns: allColumns,
      rlsEnabled: rlsEnabled,
      policies: policies,
      message: queryWorks
        ? 'is_approved column exists and works in queries'
        : columnExists
          ? 'is_approved column exists but does not work in queries'
          : 'is_approved column does not exist in the schema'
    });
  } catch (error) {
    console.error('Error checking is_approved column:', error);
    return NextResponse.json(
      { error: 'Error checking is_approved column: ' + error.message },
      { status: 500 }
    );
  }
}
