import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';
export const revalidate = 0; // Disable caching completely

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
      console.log('No session found in dashboard API');
      return NextResponse.json({
        success: false,
        error: 'No active session found',
        authenticated: false
      });
    }
    
    // Get user ID from session
    const userId = session.user.id;
    
    // Check if the user is a counselor
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('role, display_name, bio')
      .eq('id', userId)
      .single();
    
    if (profileError) {
      console.error('Error fetching profile:', profileError);
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch user profile',
        authenticated: true,
        isCounselor: false
      });
    }
    
    const isCounselor = profile?.role === 'counselor';
    
    // Get dashboard stats
    const { data: sessions, error: sessionsError } = await supabase
      .from('sessions')
      .select('id, status, session_date')
      .eq('counselor_id', userId);
    
    if (sessionsError) {
      console.error('Error fetching sessions:', sessionsError);
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch sessions',
        authenticated: true,
        isCounselor
      });
    }
    
    // Calculate stats
    const now = new Date();
    const upcomingSessions = sessions?.filter(s => new Date(s.session_date) > now).length || 0;
    const completedSessions = sessions?.filter(s => s.status === 'completed').length || 0;
    
    return NextResponse.json({
      success: true,
      authenticated: true,
      isCounselor,
      user: {
        id: userId,
        email: session.user.email,
        display_name: profile?.display_name || session.user.email.split('@')[0],
        bio: profile?.bio || '',
        role: profile?.role || 'unknown'
      },
      stats: {
        upcoming: upcomingSessions,
        completed: completedSessions,
        total: sessions?.length || 0
      }
    });
  } catch (error) {
    console.error('Unexpected error in dashboard API:', error);
    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred',
      authenticated: false
    }, { status: 500 });
  }
}
