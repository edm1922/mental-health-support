import { NextResponse } from 'next/server';
import { supabase } from '@/utils/supabaseClient';

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
    return NextResponse.json({ user: data.user });
  } catch (error) {
    console.error('Exception in sign-in API:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error.message || 'Unknown error') },
      { status: 500 }
    );
  }
}