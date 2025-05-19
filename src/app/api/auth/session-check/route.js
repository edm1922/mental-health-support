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
        authenticated: false,
        error: sessionError.message
      });
    }

    if (!session) {
      return NextResponse.json({
        authenticated: false,
        message: 'No active session found'
      });
    }

    // Get user details
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError) {
      console.error('Error getting user:', userError);
      return NextResponse.json({
        authenticated: false,
        error: userError.message
      });
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError && !profileError.message.includes('No rows found')) {
      console.error('Error getting profile:', profileError);
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
        id: user.id,
        email: user.email,
        created_at: user.created_at
      },
      profile: profile || null,
      session: {
        expires_at: session.expires_at
      },
      redirectUrl
    });
  } catch (error) {
    console.error('Unexpected error in session-check:', error);
    return NextResponse.json({
      authenticated: false,
      error: error.message
    }, { status: 500 });
  }
}
