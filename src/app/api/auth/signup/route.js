import { NextResponse } from 'next/server';
import { supabase } from '@/utils/supabaseClient';

export const dynamic = 'force-dynamic'; // This ensures the route is always dynamic

export async function POST(request) {
  try {
    console.log('Sign-up API called');
    const { email, password, displayName } = await request.json();
    console.log('Email provided:', email);
    console.log('Display name provided:', displayName);

    // Validate inputs
    if (!email || !password) {
      console.log('Missing email or password');
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    console.log('Attempting to sign up with Supabase...');
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName,
        },
      },
    });

    if (error) {
      console.error('Supabase auth error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    // Create user profile
    if (data?.user) {
      console.log('Creating user profile for:', data.user.id);
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert([
          {
            id: data.user.id,
            display_name: displayName || email.split('@')[0],
            role: 'user',
          },
        ]);

      if (profileError) {
        console.error('Error creating profile:', profileError);
        return NextResponse.json(
          { error: 'Failed to create user profile', details: profileError.message },
          { status: 500 }
        );
      }
    }

    console.log('Sign-up successful for user:', data.user.id);
    return NextResponse.json({
      user: data.user,
      message: 'User created successfully'
    });
  } catch (error) {
    console.error('Exception in sign-up API:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error.message || 'Unknown error') },
      { status: 500 }
    );
  }
}
