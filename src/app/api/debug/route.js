import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Initialize Supabase client with cookies
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    console.log('Debug API called');
    
    // Get current user
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    
    if (!userId) {
      return NextResponse.json({
        authenticated: false,
        error: 'Not authenticated'
      });
    }
    
    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();
      
    // Check if user has any sessions
    const { data: sessions, error: sessionsError } = await supabase
      .from('counseling_sessions')
      .select('id')
      .or(`counselor_id.eq.${userId},patient_id.eq.${userId}`)
      .limit(5);
      
    // Check if user has any messages
    const { data: messages, error: messagesError } = await supabase
      .from('session_messages')
      .select('id')
      .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
      .limit(5);
      
    // Get all tables in the database
    const { data: tables, error: tablesError } = await supabase
      .rpc('get_tables');
      
    return NextResponse.json({
      authenticated: true,
      userId,
      profile: {
        exists: !!profile,
        error: profileError ? profileError.message : null,
        data: profile
      },
      sessions: {
        count: sessions?.length || 0,
        error: sessionsError ? sessionsError.message : null,
        data: sessions
      },
      messages: {
        count: messages?.length || 0,
        error: messagesError ? messagesError.message : null,
        data: messages
      },
      tables: {
        error: tablesError ? tablesError.message : null,
        data: tables || []
      }
    });
  } catch (error) {
    console.error('Error in debug API:', error);
    return NextResponse.json({
      error: error.message
    }, { status: 500 });
  }
}
