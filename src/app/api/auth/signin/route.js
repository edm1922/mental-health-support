import { NextResponse } from 'next/server';
import { supabase, supabaseUrl } from '@/utils/supabaseClient';

export const dynamic = 'force-dynamic'; // This ensures the route is always dynamic

export async function POST(request) {
  try {
    console.log('Sign-in API called');
    const { email, password } = await request.json();
    console.log('Email provided:', email);

    // Validate inputs
    if (!email || !password) {
      console.log('Missing email or password');
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    console.log('Attempting to sign in with Supabase...');
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Supabase auth error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      );
    }

    console.log('Sign-in successful for user:', data.user.id);

    // Set cookies for the session
    // Extract the project reference from the URL
    const projectRef = supabaseUrl.includes('//')
      ? supabaseUrl.split('//')[1].split('.')[0]
      : supabaseUrl.split('.')[0];
    const sessionCookieName = `sb-${projectRef}-auth-token`;
    const sessionData = JSON.stringify(data.session);

    // Get user profile to determine redirect URL
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('role, display_name')
      .eq('id', data.user.id)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      return NextResponse.json(
        { error: 'Failed to fetch user profile' },
        { status: 500 }
      );
    }

    // Determine redirect URL based on role
    let redirectUrl = '/home';

    if (profile.role === 'counselor') {
      redirectUrl = '/counselor/dashboard';
    } else if (profile.role === 'admin') {
      redirectUrl = '/admin/dashboard';
    }

    console.log('User role:', profile.role);
    console.log('Redirect URL:', redirectUrl);

    // Create a response with the session data
    const response = NextResponse.json({
      user: data.user,
      profile,
      redirectUrl,
      session: data.session
    });

    // Set a cookie with the session data
    response.cookies.set(sessionCookieName, sessionData, {
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production'
    });

    return response;
  } catch (error) {
    console.error('Exception in sign-in API:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error.message || 'Unknown error') },
      { status: 500 }
    );
  }
}