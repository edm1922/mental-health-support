import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Create a Supabase client for the route handler
    const supabase = createRouteHandlerClient({ cookies });

    // Get the session
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      console.error('Error checking auth status:', error);
      return NextResponse.json({
        authenticated: false,
        error: error.message
      }, { status: 500 });
    }

    if (!session) {
      return NextResponse.json({
        authenticated: false,
        message: 'No active session found'
      });
    }

    // Get user profile if authenticated
    let profile = null;
    if (session) {
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (!profileError) {
        profile = profileData;
      } else {
        console.warn('Error fetching user profile:', profileError);
      }
    }

    // Determine redirect URL based on role
    let redirectUrl = '/home';

    if (profile?.role === 'counselor') {
      redirectUrl = '/counselor/dashboard/direct?no_redirect=true';
    } else if (profile?.role === 'admin') {
      redirectUrl = '/admin/dashboard?no_redirect=true';
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: session.user.id,
        email: session.user.email,
        last_sign_in: session.user.last_sign_in_at
      },
      profile,
      session: {
        expires_at: session.expires_at
      },
      redirectUrl
    });
  } catch (error) {
    console.error('Exception in auth status check:', error);
    return NextResponse.json({
      authenticated: false,
      error: error.message
    }, { status: 500 });
  }
}
