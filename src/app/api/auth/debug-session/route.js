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
    
    // Get user details
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('Error getting user:', userError);
      return NextResponse.json({ 
        success: false, 
        error: userError.message,
        authenticated: false
      });
    }
    
    // Try to get the user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    // Check if auth.uid() is working
    const { data: authUidResult, error: authUidError } = await supabase.rpc('get_auth_uid');
    
    // Check if the session_messages table is accessible
    const { data: messagesAccess, error: messagesError } = await supabase
      .from('session_messages')
      .select('count(*)')
      .limit(1);
    
    // Check if RLS is enabled on session_messages
    const { data: rlsStatus, error: rlsError } = await supabase
      .from('information_schema.tables')
      .select('row_level_security')
      .eq('table_name', 'session_messages')
      .eq('table_schema', 'public')
      .single();
    
    return NextResponse.json({
      success: true,
      authenticated: true,
      session: {
        id: session.id,
        expires_at: session.expires_at,
        token_type: session.token_type
      },
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        aud: user.aud,
        created_at: user.created_at
      },
      profile: profileError ? null : profile,
      profileError: profileError ? profileError.message : null,
      authUid: authUidError ? null : authUidResult,
      authUidError: authUidError ? authUidError.message : null,
      messagesAccess: messagesError ? null : messagesAccess,
      messagesError: messagesError ? messagesError.message : null,
      rlsStatus: rlsError ? null : rlsStatus,
      rlsError: rlsError ? rlsError.message : null
    });
  } catch (error) {
    console.error('Unexpected error in debug-session API:', error);
    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred',
      authenticated: false
    }, { status: 500 });
  }
}
