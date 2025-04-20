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
    
    // We'll allow this endpoint to be called without authentication
    // since it's meant to be called automatically by the system
    
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
    
    // Force a schema cache refresh
    try {
      // This is a workaround to force Supabase to refresh its schema cache
      await supabase.rpc('pg_notify', { channel: 'pgrst', payload: 'reload schema' });
    } catch (notifyError) {
      console.error('Error refreshing schema cache:', notifyError);
    }
    
    return NextResponse.json({
      success: true,
      message: 'Database relationships fixed automatically'
    });
  } catch (error) {
    console.error('Error fixing database relationships:', error);
    return NextResponse.json(
      { error: 'Failed to fix database relationships: ' + error.message },
      { status: 500 }
    );
  }
}
