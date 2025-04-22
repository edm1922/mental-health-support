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
        error: sessionError.message,
        authenticated: false
      });
    }
    
    if (!session) {
      return NextResponse.json({ 
        success: false,
        error: 'No active session found',
        authenticated: false
      });
    }
    
    // Try to disable RLS first
    try {
      const { data: disableRlsResult, error: disableRlsError } = await supabase
        .rpc('disable_session_messages_rls');
      
      console.log('RLS disable attempt result:', disableRlsResult, disableRlsError);
    } catch (rlsError) {
      console.error('Error trying to disable RLS:', rlsError);
      // Continue anyway - this is not critical
    }
    
    // Check if we can access the session_messages table
    const { data: messages, error: messagesError } = await supabase
      .from('session_messages')
      .select('count(*)')
      .limit(1);
    
    if (messagesError) {
      console.error('Error accessing session_messages:', messagesError);
      return NextResponse.json({
        success: false,
        error: 'Failed to access session_messages: ' + messagesError.message,
        authenticated: true
      });
    }
    
    // Try to insert a test message
    const testSessionId = 'f19de89f-506a-4207-aa21-f09bda8d0dfb'; // Use a known session ID
    const { data: insertResult, error: insertError } = await supabase
      .from('session_messages')
      .insert({
        session_id: testSessionId,
        sender_id: session.user.id,
        recipient_id: '1ccdfb9d-df48-4250-ba89-68c181b8c012', // Use a known counselor ID
        message: 'Test message from API',
        is_read: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select();
    
    return NextResponse.json({
      success: true,
      authenticated: true,
      messagesCount: messages,
      insertResult: insertResult,
      insertError: insertError ? insertError.message : null
    });
  } catch (error) {
    console.error('Unexpected error in check-messages-access API:', error);
    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred',
      authenticated: false
    }, { status: 500 });
  }
}
