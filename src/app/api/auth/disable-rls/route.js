import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET() {
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
    
    // Try to disable RLS on session_messages table
    const { data: disableRlsResult, error: disableRlsError } = await supabase
      .rpc('disable_session_messages_rls');
    
    if (disableRlsError) {
      console.error('Error disabling RLS:', disableRlsError);
      return NextResponse.json({
        success: false,
        error: 'Failed to disable RLS: ' + disableRlsError.message
      });
    }
    
    return NextResponse.json({
      success: true,
      result: disableRlsResult
    });
  } catch (error) {
    console.error('Unexpected error in disable-rls API:', error);
    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred'
    }, { status: 500 });
  }
}
