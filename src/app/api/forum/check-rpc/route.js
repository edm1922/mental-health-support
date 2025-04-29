import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Initialize Supabase client
    const supabase = createRouteHandlerClient({ cookies });

    // Get the session if available
    const { data: { session } } = await supabase.auth.getSession();
    console.log('Session:', session ? 'User is authenticated' : 'No session');

    // Check if the exec_sql function exists
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: 'SELECT 1 as test'
    });

    if (error) {
      console.error('Error checking RPC function:', error);
      return NextResponse.json(
        { 
          error: 'RPC function error: ' + error.message,
          exists: false
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      exists: true,
      message: 'RPC function exists and is working',
      data
    });
  } catch (error) {
    console.error('Unexpected error in check-rpc API:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + error.message,
        exists: false
      },
      { status: 500 }
    );
  }
}
