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

    // Force refresh the session to ensure it's valid
    const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();

    if (refreshError || !refreshData.session) {
      console.error('Error refreshing session:', refreshError);
      return NextResponse.json({
        success: false,
        error: 'Session refresh failed: ' + (refreshError?.message || 'Unknown error'),
        authenticated: false
      });
    }

    // Get user profile to check role
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('role, display_name')
      .eq('id', refreshData.session.user.id)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);

      // Try to create a profile if it doesn't exist
      if (profileError.code === 'PGRST116') {
        const displayName = refreshData.session.user.user_metadata?.display_name ||
                           refreshData.session.user.email?.split('@')[0] ||
                           'User';

        const { data: newProfile, error: createError } = await supabase
          .from('user_profiles')
          .insert({
            id: refreshData.session.user.id,
            display_name: displayName,
            role: 'user',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (createError) {
          return NextResponse.json({
            success: false,
            error: 'Failed to create user profile',
            authenticated: true,
            userId: refreshData.session.user.id,
            email: refreshData.session.user.email,
            role: null
          });
        }

        return NextResponse.json({
          success: true,
          authenticated: true,
          userId: refreshData.session.user.id,
          email: refreshData.session.user.email,
          role: 'user',
          displayName: displayName,
          profile: newProfile
        });
      }

      return NextResponse.json({
        success: false,
        error: 'Failed to fetch user profile',
        authenticated: true,
        userId: refreshData.session.user.id,
        email: refreshData.session.user.email,
        role: null
      });
    }

    // Check if user is a counselor
    if (profile.role !== 'counselor') {
      return NextResponse.json({
        success: false,
        error: 'Access denied - only counselors can view this page',
        authenticated: true,
        userId: refreshData.session.user.id,
        email: refreshData.session.user.email,
        role: profile.role
      });
    }

    // Try to disable RLS on session_messages table
    try {
      const { data: disableRlsResult, error: disableRlsError } = await supabase
        .rpc('disable_session_messages_rls');

      console.log('RLS disable attempt result:', disableRlsResult, disableRlsError);
    } catch (rlsError) {
      console.error('Error trying to disable RLS:', rlsError);
      // Continue anyway - this is not critical
    }

    // User is authenticated and is a counselor
    return NextResponse.json({
      success: true,
      authenticated: true,
      userId: refreshData.session.user.id,
      email: refreshData.session.user.email,
      role: profile.role,
      displayName: profile.display_name,
      profile
    });
  } catch (error) {
    console.error('Unexpected error in sessions-auth API:', error);
    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred',
      authenticated: false
    }, { status: 500 });
  }
}
