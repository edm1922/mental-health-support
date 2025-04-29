import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request) {
  try {
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
    
    // Get foreign key constraints
    const { data: foreignKeys, error: foreignKeysError } = await supabase
      .from('information_schema.table_constraints')
      .select('constraint_name, table_name')
      .eq('constraint_type', 'FOREIGN KEY')
      .in('table_name', ['session_messages', 'counseling_sessions'])
      .eq('table_schema', 'public');
    
    if (foreignKeysError) {
      console.error('Error fetching foreign keys:', foreignKeysError);
      return NextResponse.json(
        { error: 'Failed to fetch foreign keys: ' + foreignKeysError.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      foreignKeys: foreignKeys || []
    });
  } catch (error) {
    console.error('Error fetching foreign keys:', error);
    return NextResponse.json(
      { error: 'Failed to fetch foreign keys: ' + error.message },
      { status: 500 }
    );
  }
}
