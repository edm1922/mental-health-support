import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Initialize Supabase client
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    console.log('Debug auth API called');

    // Get the current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      console.error('Error getting session:', sessionError);
      return NextResponse.json({
        success: false,
        error: 'Failed to get session: ' + sessionError.message
      });
    }

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError) {
      console.error('Error getting user:', userError);
      return NextResponse.json({
        success: false,
        error: 'Failed to get user: ' + userError.message,
        session: session ? {
          id: session.id,
          expires_at: session.expires_at
        } : null
      });
    }

    // Get user profile if user exists
    let userProfile = null;
    let profileError = null;

    if (user) {
      try {
        const { data: profile, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        userProfile = profile;
        profileError = error;

        if (error) {
          console.error('Error fetching user profile:', error);
        } else if (profile) {
          console.log('User profile found with role:', profile.role);
        } else {
          console.log('No user profile found for user ID:', user.id);
        }
      } catch (error) {
        profileError = error;
        console.error('Exception fetching user profile:', error);
      }
    }

    // Try to get user with RPC function
    let rpcUser = null;
    let rpcError = null;

    try {
      const { data: userData, error } = await supabase.rpc('get_current_user');
      rpcUser = userData;
      rpcError = error;
    } catch (error) {
      rpcError = error;
    }

    // Check cookies
    const allCookies = {};
    for (const cookie of cookieStore.getAll()) {
      allCookies[cookie.name] = cookie.value;
    }

    // Get auth.uid() directly
    let authUid = null;
    let authUidError = null;

    try {
      const { data, error } = await supabase.rpc('exec_sql', {
        sql: 'SELECT auth.uid() as uid;'
      });

      if (error) {
        authUidError = error;
      } else {
        authUid = data;
      }
    } catch (error) {
      authUidError = error;
    }

    // Get all user profiles for debugging
    let allProfiles = null;
    let allProfilesError = null;

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, role, display_name')
        .limit(10);

      allProfiles = data;
      allProfilesError = error;
    } catch (error) {
      allProfilesError = error;
    }

    // Determine redirect URL based on role
    let redirectUrl = '/home';

    if (userProfile?.role === 'counselor') {
      redirectUrl = '/counselor/dashboard';
    } else if (userProfile?.role === 'admin') {
      redirectUrl = '/admin/dashboard';
    }

    return NextResponse.json({
      success: true,
      session: session ? {
        id: session.id,
        user_id: session.user.id,
        expires_at: session.expires_at
      } : null,
      user: user ? {
        id: user.id,
        email: user.email
      } : null,
      user_profile: userProfile,
      profile_error: profileError ? profileError.message : null,
      redirect_url: redirectUrl,
      rpc_user: rpcUser,
      rpc_error: rpcError ? rpcError.message : null,
      auth_uid: authUid,
      auth_uid_error: authUidError ? authUidError.message : null,
      all_profiles: allProfiles,
      all_profiles_error: allProfilesError ? allProfilesError.message : null,
      cookies: {
        has_access_token: !!allCookies['sb-access-token'],
        has_refresh_token: !!allCookies['sb-refresh-token'],
        has_supabase_auth: !!allCookies['supabase-auth-token'],
        cookie_count: Object.keys(allCookies).length,
        cookie_names: Object.keys(allCookies)
      }
    });
  } catch (error) {
    console.error('Unexpected error in debug auth API:', error);
    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred: ' + error.message
    });
  }
}
