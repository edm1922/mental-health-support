import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Initialize Supabase client with cookies
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    console.log('Disabling RLS on all relevant tables');
    
    // Disable RLS on session_messages table
    const { error: messagesError } = await supabase.rpc('exec_sql', { 
      sql: `ALTER TABLE public.session_messages DISABLE ROW LEVEL SECURITY;`
    });
    
    if (messagesError) {
      console.error('Error disabling RLS on session_messages:', messagesError);
      return NextResponse.json({
        success: false,
        error: 'Failed to disable RLS on session_messages: ' + messagesError.message
      });
    }
    
    // Disable RLS on counseling_sessions table
    const { error: sessionsError } = await supabase.rpc('exec_sql', { 
      sql: `ALTER TABLE public.counseling_sessions DISABLE ROW LEVEL SECURITY;`
    });
    
    if (sessionsError) {
      console.error('Error disabling RLS on counseling_sessions:', sessionsError);
      return NextResponse.json({
        success: false,
        error: 'Failed to disable RLS on counseling_sessions: ' + sessionsError.message
      });
    }
    
    return NextResponse.json({
      success: true,
      message: 'RLS disabled successfully on all relevant tables'
    });
  } catch (error) {
    console.error('Error in disable-all-rls API:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
