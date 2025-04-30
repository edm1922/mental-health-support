import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request) {
  try {
    // Get the table name from the query parameters
    const { searchParams } = new URL(request.url);
    const tableName = searchParams.get('table');

    if (!tableName) {
      return NextResponse.json(
        { error: 'Table name is required' },
        { status: 400 }
      );
    }

    // Initialize Supabase client
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Get the current session
    const { data: { session } } = await supabase.auth.getSession();
    
    // Check if user is authenticated
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Check if the table exists
    const { data: tableExists, error: tableCheckError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_name', tableName)
      .eq('table_schema', 'public')
      .single();
    
    if (tableCheckError) {
      // Table doesn't exist
      return NextResponse.json({
        exists: false,
        columns: []
      });
    }
    
    // Get the columns of the table
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_name', tableName)
      .eq('table_schema', 'public')
      .order('ordinal_position', { ascending: true });
    
    if (columnsError) {
      console.error('Error fetching columns:', columnsError);
      return NextResponse.json(
        { error: 'Failed to fetch table structure: ' + columnsError.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      exists: true,
      columns: columns
    });
  } catch (error) {
    console.error('Error fetching table structure:', error);
    return NextResponse.json(
      { error: 'Failed to fetch table structure: ' + error.message },
      { status: 500 }
    );
  }
}
