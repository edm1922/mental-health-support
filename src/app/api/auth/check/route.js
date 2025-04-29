import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    // Initialize Supabase client with proper cookie handling
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    console.log('Auth check API called');

    // Log all cookies for debugging
    const allCookies = cookieStore.getAll();
    console.log('Cookies received:', allCookies.map(c => c.name));

    // Check for access token cookie specifically
    const accessTokenCookie = allCookies.find(c => c.name === 'sb-access-token');
    if (accessTokenCookie) {
      console.log('Access token cookie found:', accessTokenCookie.value.substring(0, 10) + '...');
    } else {
      console.log('No access token cookie found');
    }

    // Get the session if available
    let { data: { session } } = await supabase.auth.getSession();

    console.log('Session check result:', session ? 'Session found' : 'No session found');

    // If no session, try to refresh it
    if (!session) {
      console.log('No session found, attempting to refresh...');
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();

      if (refreshError) {
        console.error('Session refresh error:', refreshError);
      } else if (refreshData.session) {
        console.log('Session refreshed successfully');
        // Use the refreshed session
        session = refreshData.session;
      }
    }

    // If still no session and we have an access token cookie, try to use it directly
    if (!session && accessTokenCookie) {
      console.log('Trying to set session using access token cookie');
      try {
        const { data: tokenData, error: tokenError } = await supabase.auth.setSession({
          access_token: accessTokenCookie.value,
          refresh_token: '' // We don't have the refresh token
        });

        if (tokenError) {
          console.error('Error setting session from cookie:', tokenError);
        } else if (tokenData?.session) {
          console.log('Session set successfully from cookie');
          session = tokenData.session;
        }
      } catch (tokenSetError) {
        console.error('Exception setting session from cookie:', tokenSetError);
      }
    }

    if (!session) {
      return NextResponse.json({
        authenticated: false,
        message: "Not authenticated"
      });
    }

    // Check if the user has a profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (profileError && profileError.code === 'PGRST116') {
      // Profile doesn't exist, create one
      const displayName = session.user.user_metadata?.display_name ||
                        session.user.email?.split('@')[0] ||
                        'User';

      const { error: createError } = await supabase
        .from('user_profiles')
        .insert({
          id: session.user.id,
          display_name: displayName,
          bio: '',
          role: 'user',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (createError) {
        console.error('Error creating profile:', createError);
        return NextResponse.json({
          authenticated: true,
          user: session.user,
          profile_created: false,
          error: createError.message
        });
      }

      return NextResponse.json({
        authenticated: true,
        user: session.user,
        profile_created: true
      });
    } else if (profileError) {
      console.error('Error checking profile:', profileError);
      return NextResponse.json({
        authenticated: true,
        user: session.user,
        profile_error: profileError.message
      });
    }

    return NextResponse.json({
      authenticated: true,
      user: session.user,
      profile: profile
    });
  } catch (error) {
    console.error('Error in auth check:', error);
    return NextResponse.json({
      authenticated: false,
      error: error.message
    }, { status: 500 });
  }
}
