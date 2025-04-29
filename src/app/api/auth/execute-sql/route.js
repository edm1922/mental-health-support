import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    // Initialize Supabase client
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Error checking session:', sessionError);
      return NextResponse.json({ 
        success: false, 
        error: sessionError.message
      });
    }
    
    if (!session) {
      return NextResponse.json({ 
        success: false,
        error: 'No active session found'
      });
    }
    
    // Get the SQL to execute from the request body
    const { sql } = await request.json();
    
    if (!sql) {
      return NextResponse.json({
        success: false,
        error: 'No SQL provided'
      });
    }
    
    // Execute the SQL
    const { data, error } = await supabase.rpc('execute_sql', { sql_query: sql });
    
    if (error) {
      console.error('Error executing SQL:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to execute SQL: ' + error.message
      });
    }
    
    return NextResponse.json({
      success: true,
      result: data
    });
  } catch (error) {
    console.error('Unexpected error in execute-sql API:', error);
    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred'
    }, { status: 500 });
  }
}
