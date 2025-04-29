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

    console.log('Creating ensure_rls_disabled function');

    // Read the SQL file
    const sqlFilePath = path.join(process.cwd(), 'src', 'sql', 'create_ensure_rls_disabled_function.sql');
    const sqlQuery = fs.readFileSync(sqlFilePath, 'utf8');

    // Execute the SQL query
    const { error: sqlError } = await supabase.rpc('exec_sql', { sql: sqlQuery });

    if (sqlError) {
      console.error('Error creating function:', sqlError);
      return NextResponse.json({
        success: false,
        error: 'Failed to create function: ' + sqlError.message
      }, { status: 500 });
    }

    console.log('Function created successfully');

    // Now call the function to ensure RLS is disabled
    const { error: callError } = await supabase.rpc('ensure_rls_disabled');

    if (callError) {
      console.error('Error calling function:', callError);
      return NextResponse.json({
        success: false,
        error: 'Function created but failed to call: ' + callError.message
      }, { status: 500 });
    }

    console.log('Function called successfully');

    return NextResponse.json({
      success: true,
      message: 'RLS function created and called successfully'
    });
  } catch (error) {
    console.error('Error in create RLS function API:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
