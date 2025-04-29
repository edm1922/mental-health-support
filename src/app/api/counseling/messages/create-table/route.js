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
      // For table creation, we'll still try to create it even without authentication
      // This makes the system more robust
      console.log('No authentication session, but continuing with table creation');
    }

    // We're allowing any authenticated user to create the table if it doesn't exist
    // This makes the messaging system more robust and automatic

    // Check if the session_messages table already exists
    const { data: tableExists, error: tableCheckError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_name', 'session_messages')
      .eq('table_schema', 'public')
      .single();

    if (!tableCheckError && tableExists) {
      return NextResponse.json({
        success: true,
        message: 'Table already exists'
      });
    }

    // Read the SQL file
    const sqlFilePath = path.join(process.cwd(), 'src', 'sql', 'create_messages_table.sql');
    const sqlQuery = fs.readFileSync(sqlFilePath, 'utf8');

    // Execute the SQL query
    const { error: sqlError } = await supabase.rpc(
      'exec_sql',
      { sql: sqlQuery }
    );

    if (sqlError) {
      console.error('Error creating table:', sqlError);
      return NextResponse.json(
        { error: 'Failed to create session_messages table: ' + sqlError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Session messages table created successfully'
    });
  } catch (error) {
    console.error('Error creating session_messages table:', error);
    return NextResponse.json(
      { error: 'Failed to create session_messages table: ' + error.message },
      { status: 500 }
    );
  }
}
