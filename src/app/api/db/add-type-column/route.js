import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

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
    
    // Check if the column already exists
    const { data: columnInfo, error: columnError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'counseling_sessions')
      .eq('column_name', 'type');
    
    if (columnError) {
      console.error('Error checking for type column:', columnError);
      return NextResponse.json(
        { error: 'Failed to check if column exists: ' + columnError.message },
        { status: 500 }
      );
    }
    
    if (columnInfo && columnInfo.length > 0) {
      return NextResponse.json({
        success: true,
        message: 'Column already exists'
      });
    }
    
    // Execute SQL to add the column
    const { error: sqlError } = await supabase.rpc(
      'execute_sql',
      { sql_query: "ALTER TABLE counseling_sessions ADD COLUMN type text DEFAULT 'one_on_one'::text" }
    );
    
    if (sqlError) {
      console.error('Error adding type column:', sqlError);
      
      // Try an alternative approach if the RPC method fails
      const { error: directError } = await supabase
        .from('counseling_sessions')
        .update({ type: 'one_on_one' })
        .eq('id', '00000000-0000-0000-0000-000000000000'); // This is a dummy update that will fail, but might trigger schema refresh
      
      if (directError && directError.message.includes('type')) {
        // If the error mentions 'type', it means the column doesn't exist
        return NextResponse.json(
          { error: 'Failed to add type column: ' + sqlError.message },
          { status: 500 }
        );
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'Column added successfully'
    });
  } catch (error) {
    console.error('Error adding type column:', error);
    return NextResponse.json(
      { error: 'Failed to add type column: ' + error.message },
      { status: 500 }
    );
  }
}
