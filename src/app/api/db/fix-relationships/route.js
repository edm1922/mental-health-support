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
    
    // Check if user is authenticated
    if (!session) {
      // For database fixes, we need authentication
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Read the SQL file
    const sqlFilePath = path.join(process.cwd(), 'src', 'sql', 'fix_database_relationships.sql');
    const sqlQuery = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Execute the SQL query
    const { error: sqlError } = await supabase.rpc(
      'exec_sql',
      { sql: sqlQuery }
    );
    
    if (sqlError) {
      console.error('Error executing SQL:', sqlError);
      
      // Try an alternative approach
      const { error: directError } = await supabase.rpc(
        'execute_sql',
        { sql_query: sqlQuery }
      );
      
      if (directError) {
        return NextResponse.json(
          { error: 'Failed to fix database relationships: ' + (directError.message || sqlError.message) },
          { status: 500 }
        );
      }
    }
    
    // Check the current structure of the tables
    const { data: sessionMessagesColumns, error: sessionMessagesError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type')
      .eq('table_name', 'session_messages')
      .eq('table_schema', 'public');
    
    const { data: counselingSessionsColumns, error: counselingSessionsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type')
      .eq('table_name', 'counseling_sessions')
      .eq('table_schema', 'public');
    
    // Check foreign key constraints
    const { data: foreignKeys, error: foreignKeysError } = await supabase
      .from('information_schema.table_constraints')
      .select('constraint_name, table_name')
      .eq('constraint_type', 'FOREIGN KEY')
      .in('table_name', ['session_messages', 'counseling_sessions'])
      .eq('table_schema', 'public');
    
    if (sessionMessagesError || counselingSessionsError || foreignKeysError) {
      console.error('Error fetching table structure:', sessionMessagesError || counselingSessionsError || foreignKeysError);
    }
    
    // Force a schema cache refresh
    try {
      // This is a workaround to force Supabase to refresh its schema cache
      await supabase.rpc('pg_notify', { channel: 'pgrst', payload: 'reload schema' });
    } catch (notifyError) {
      console.error('Error refreshing schema cache:', notifyError);
    }
    
    return NextResponse.json({
      success: true,
      message: 'Database relationships fixed successfully',
      sessionMessagesColumns: sessionMessagesColumns || [],
      counselingSessionsColumns: counselingSessionsColumns || [],
      foreignKeys: foreignKeys || []
    });
  } catch (error) {
    console.error('Error fixing database relationships:', error);
    return NextResponse.json(
      { error: 'Failed to fix database relationships: ' + error.message },
      { status: 500 }
    );
  }
}
