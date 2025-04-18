import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request) {
  try {
    console.log('Check admin status API called');

    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    console.log('Auth header present:', !!authHeader);

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('No valid authorization header');
      return NextResponse.json(
        { isAdmin: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Extract the token
    const token = authHeader.split(' ')[1];

    // Initialize Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Missing Supabase environment variables');
      return NextResponse.json(
        { isAdmin: false, error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      },
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    });

    // Get the user from the token
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError) {
      console.error('Error getting user:', userError);
      return NextResponse.json(
        { isAdmin: false, error: 'Authentication error' },
        { status: 401 }
      );
    }

    const userId = userData.user.id;
    console.log('Checking admin status for user:', userId);

    // Query the user_profiles table directly
    console.log('Querying user_profiles for user ID:', userId);

    // Try with exact ID match first
    let { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    // If no profile found, try with toString() in case of UUID/string mismatch
    if (profileError && profileError.code === 'PGRST116') {
      console.log('Profile not found with exact ID, trying with toString()');
      const { data: profileAlt, error: profileAltError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId.toString())
        .single();

      if (!profileAltError) {
        profile = profileAlt;
        profileError = null;
        console.log('Profile found with toString() conversion');
      }
    }

    if (profileError) {
      console.error('Error fetching user profile:', profileError);
      return NextResponse.json(
        { isAdmin: false, error: 'Failed to fetch user profile: ' + profileError.message },
        { status: 500 }
      );
    }

    console.log('User profile found:', profile);
    const isAdmin = profile?.role === 'admin';
    console.log('User admin status:', isAdmin, 'Role:', profile?.role);

    return NextResponse.json({ isAdmin });
  } catch (error) {
    console.error('Error checking admin status:', error);
    return NextResponse.json(
      { isAdmin: false, error: 'Failed to check admin status: ' + error.message },
      { status: 500 }
    );
  }
}
