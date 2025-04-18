import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic'; // This ensures the route is always dynamic

export async function POST(request) {
  try {
    console.log('Create profile API called');

    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    console.log('Auth header present:', !!authHeader);

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('No valid authorization header');
      return NextResponse.json(
        { error: 'Unauthorized - Missing or invalid token' },
        { status: 401 }
      );
    }

    // Extract the token
    const token = authHeader.split(' ')[1];
    console.log('Token length:', token?.length);

    // Create a server-side client with the token
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Missing Supabase environment variables');
      return NextResponse.json(
        { error: 'Server configuration error - Missing API credentials' },
        { status: 500 }
      );
    }

    console.log('Creating client with URL:', supabaseUrl);
    const supabaseServer = createClient(supabaseUrl, supabaseAnonKey, {
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

    // Set the auth token to bypass RLS
    await supabaseServer.auth.setSession({ access_token: token, refresh_token: '' });

    // Get the current user using the token
    console.log('Getting user from token');
    const { data: userData, error: sessionError } = await supabaseServer.auth.getUser(token);

    if (sessionError) {
      console.error('Auth error:', sessionError);
      return NextResponse.json(
        { error: 'Authentication error: ' + sessionError.message },
        { status: 401 }
      );
    }

    const user = userData?.user;
    console.log('User retrieved:', user ? `ID: ${user.id}` : 'No user');

    if (!user) {
      console.error('No authenticated user found');
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in' },
        { status: 401 }
      );
    }

    // Check if profile already exists
    const { data: existingProfile, error: checkError } = await supabaseServer
      .from('user_profiles')
      .select('id')
      .eq('id', user.id)
      .single();

    if (!checkError && existingProfile) {
      console.log('Profile already exists, no need to create');
      return NextResponse.json({
        success: true,
        message: 'Profile already exists',
        profile_id: existingProfile.id
      });
    }

    if (checkError && checkError.code !== 'PGRST116') { // Not the "not found" error
      console.error('Error checking for existing profile:', checkError);
      return NextResponse.json(
        { error: 'Failed to check for existing profile: ' + checkError.message },
        { status: 500 }
      );
    }

    // Create a new profile
    const profileData = {
      id: user.id.toString(),
      display_name: user.email?.split('@')[0] || 'User',
      bio: '',
      role: 'user',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_active: new Date().toISOString()
    };

    console.log('Creating new profile with data:', JSON.stringify(profileData));

    const { data: newProfile, error: createError } = await supabaseServer
      .from('user_profiles')
      .insert(profileData)
      .select()
      .single();

    if (createError) {
      console.error('Error creating profile:', createError);
      return NextResponse.json(
        { error: 'Failed to create profile: ' + createError.message },
        { status: 500 }
      );
    }

    console.log('Profile created successfully');
    return NextResponse.json({
      success: true,
      message: 'Profile created successfully',
      profile: newProfile
    });
  } catch (error) {
    console.error('Exception in create profile API:', error);
    return NextResponse.json(
      { error: 'Failed to create profile: ' + (error.message || 'Unknown error') },
      { status: 500 }
    );
  }
}
