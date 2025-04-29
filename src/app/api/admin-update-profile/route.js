import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic'; // This ensures the route is always dynamic

// We'll create the admin client inside the function to ensure we have access to the environment variables

export async function POST(request) {
  try {
    console.log('Admin update profile API called');

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

    // Get the request data
    const requestData = await request.json();
    console.log('Request data received:', JSON.stringify(requestData));

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

    // Extract profile data from request
    const { displayName, bio } = requestData;

    // Prepare the profile data - only using fields that exist in the schema
    const profileData = {
      id: user.id,
      display_name: displayName || null,
      bio: bio || null,
      role: 'user',
      updated_at: new Date().toISOString()
    };

    console.log('Profile data prepared:', JSON.stringify(profileData));

    // First check if the profile exists
    const { data: existingProfile, error: fetchError } = await supabaseAdmin
      .from('user_profiles')
      .select('id')
      .eq('id', user.id)
      .single();

    console.log('Existing profile check:', existingProfile ? 'Found' : 'Not found', fetchError ? `Error: ${fetchError.message}` : 'No error');

    let result, error;

    if (existingProfile) {
      // Update existing profile
      console.log('Updating existing profile with admin privileges');
      const response = await supabaseAdmin
        .from('user_profiles')
        .update(profileData)
        .eq('id', user.id)
        .select();

      result = response.data;
      error = response.error;
    } else {
      // Insert new profile
      console.log('Creating new profile with admin privileges');
      const response = await supabaseAdmin
        .from('user_profiles')
        .insert(profileData)
        .select();

      result = response.data;
      error = response.error;
    }

    if (error) {
      console.error('Error updating/creating profile:', error);
      return NextResponse.json(
        { error: 'Failed to update profile', details: error.message },
        { status: 500 }
      );
    }

    if (!result || result.length === 0) {
      console.error('Operation succeeded but no data returned');

      // Try to fetch the profile to return it
      const { data: fetchedProfile, error: fetchError } = await supabaseAdmin
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (fetchError) {
        console.error('Error fetching profile after operation:', fetchError);
        return NextResponse.json(
          { error: 'Profile updated but failed to fetch the updated profile' },
          { status: 500 }
        );
      }

      console.log('Profile fetched after operation');
      return NextResponse.json({
        success: true,
        profile: fetchedProfile
      });
    }

    console.log('Profile operation successful');
    return NextResponse.json({
      success: true,
      profile: result[0]
    });
  } catch (error) {
    console.error('Exception in admin update profile API:', error);
    return NextResponse.json(
      { error: 'Failed to update profile: ' + (error.message || 'Unknown error') },
      { status: 500 }
    );
  }
}
