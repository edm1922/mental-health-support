import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import fs from 'fs';
import path from 'path';

export async function POST(request) {
  try {
    // Initialize Supabase client
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Get the current session
    const { data: { session } } = await supabase.auth.getSession();
    
    // Check if user is authenticated and is an admin
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Check if the user is an admin
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();
    
    if (profileError || profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }
    
    // Read the SQL file
    const sqlFilePath = path.join(process.cwd(), 'src', 'sql', 'fix_counseling_sessions_table.sql');
    const sqlQuery = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Execute the SQL query
    const { error: sqlError } = await supabase.rpc(
      'execute_sql',
      { sql_query: sqlQuery }
    );
    
    if (sqlError) {
      console.error('Error executing SQL:', sqlError);
      
      // Try an alternative approach
      const { error: directError } = await supabase.rpc(
        'exec_sql',
        { sql: sqlQuery }
      );
      
      if (directError) {
        return NextResponse.json(
          { error: 'Failed to fix counseling_sessions table: ' + (directError.message || sqlError.message) },
          { status: 500 }
        );
      }
    }
    
    // Check the current structure of the table
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type')
      .eq('table_name', 'counseling_sessions')
      .eq('table_schema', 'public');
    
    if (columnsError) {
      console.error('Error fetching columns:', columnsError);
      return NextResponse.json(
        { error: 'Failed to fetch table structure: ' + columnsError.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Counseling sessions table fixed successfully',
      columns: columns
    });
  } catch (error) {
    console.error('Error fixing counseling_sessions table:', error);
    return NextResponse.json(
      { error: 'Failed to fix counseling_sessions table: ' + error.message },
      { status: 500 }
    );
  }
}
