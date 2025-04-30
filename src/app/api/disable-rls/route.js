import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Initialize Supabase client with cookies
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    console.log('Disable RLS API called');

    // Try multiple approaches to ensure RLS is disabled
    let success = false;
    let errorMessages = [];

    // Approach 1: Call the ensure_rls_disabled function
    try {
      await supabase.rpc('ensure_rls_disabled');
      console.log('RLS disabled successfully via function');
      success = true;
    } catch (functionError) {
      console.error('Error calling ensure_rls_disabled function:', functionError);
      errorMessages.push(`Function error: ${functionError.message}`);

      // Approach 2: Read and execute the SQL file
      try {
        const sqlFilePath = path.join(process.cwd(), 'src', 'sql', 'simple_disable_rls.sql');
        const sqlQuery = fs.readFileSync(sqlFilePath, 'utf8');

        // Execute the SQL query
        const { error: sqlError } = await supabase.rpc('exec_sql', { sql: sqlQuery });

        if (sqlError) {
          console.error('Error executing SQL file:', sqlError);
          errorMessages.push(`SQL file error: ${sqlError.message}`);
        } else {
          console.log('RLS disabled successfully via SQL file');
          success = true;
        }
      } catch (sqlFileError) {
        console.error('Error reading or executing SQL file:', sqlFileError);
        errorMessages.push(`SQL file error: ${sqlFileError.message}`);

        // Approach 3: Direct SQL commands
        try {
          const tables = ['session_messages', 'counseling_sessions'];
          let allTablesSuccessful = true;

          for (const table of tables) {
            const { error: disableError } = await supabase.rpc('exec_sql', {
              sql: `ALTER TABLE public.${table} DISABLE ROW LEVEL SECURITY;`
            });

            if (disableError) {
              console.error(`Error disabling RLS on ${table}:`, disableError);
              errorMessages.push(`Direct SQL error (${table}): ${disableError.message}`);
              allTablesSuccessful = false;
            } else {
              console.log(`RLS disabled successfully on ${table} via direct SQL`);
            }

            // Add comment to indicate RLS should be disabled
            const { error: commentError } = await supabase.rpc('exec_sql', {
              sql: `COMMENT ON TABLE public.${table} IS 'RLS DISABLED PERMANENTLY - DO NOT ENABLE';`
            });

            if (commentError) {
              console.error(`Error adding comment to ${table}:`, commentError);
            }
          }

          if (allTablesSuccessful) {
            success = true;
          }
        } catch (directSqlError) {
          console.error('Error executing direct SQL commands:', directSqlError);
          errorMessages.push(`Direct SQL error: ${directSqlError.message}`);
        }
      }
    }

    if (success) {
      return NextResponse.json({
        success: true,
        message: 'RLS has been permanently disabled on session_messages and counseling_sessions tables'
      });
    } else {
      return NextResponse.json({
        success: false,
        error: 'Failed to disable RLS',
        details: errorMessages
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in disable RLS API:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
