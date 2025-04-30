import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic'; // This ensures the route is always dynamic

// We'll create the admin client inside the function to ensure we have access to the environment variables

export async function POST(request) {
  try {
    console.log('Admin get profile API called');

    // Create a Supabase client with the service role key (has admin privileges)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase environment variables');
      return NextResponse.json(
        { error: 'Server configuration error - Missing API credentials' },
        { status: 500 }
      );
    }

    console.log('Creating admin client with URL:', supabaseUrl);
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

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

    // Get the current user using the token
    console.log('Getting user from token');
    const { data: userData, error: sessionError } = await supabaseAdmin.auth.getUser(token);

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

    // Get the user profile
    try {
      console.log('Fetching profile for user ID:', user.id);
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('user_profiles')
        .select('*')
        .eq('id', user.id.toString())
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);

        // If the profile doesn't exist, return a default profile structure
        if (profileError.code === 'PGRST116') { // Not found
          console.log('Profile not found, returning default structure');
          return NextResponse.json({
            id: user.id.toString(),
            display_name: user.email?.split('@')[0] || 'User',
            bio: '',
            role: 'user',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        }

        return NextResponse.json(
          { error: 'Failed to fetch profile: ' + profileError.message },
          { status: 500 }
        );
      }

      console.log('Profile fetched successfully');
      return NextResponse.json(profile);
    } catch (err) {
      console.error('Exception fetching profile:', err);
      return NextResponse.json(
        { error: 'Exception fetching profile: ' + (err.message || 'Unknown error') },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Exception in admin get profile API:', error);
    return NextResponse.json(
      { error: 'Failed to get profile: ' + (error.message || 'Unknown error') },
      { status: 500 }
    );
  }
}
