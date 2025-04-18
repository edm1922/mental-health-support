import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic'; // This ensures the route is always dynamic

export async function POST(request) {
  try {
    console.log('Basic update profile API called');

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

    // Try to use upsert to either insert or update the profile
    try {
      console.log('Attempting upsert operation');

      // First check if the profile exists
      const { data: existingProfile, error: fetchError } = await supabaseServer
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is the "not found" error
        console.error('Error checking for existing profile:', fetchError);
        return NextResponse.json(
          { error: 'Failed to check for existing profile', details: fetchError.message },
          { status: 500 }
        );
      }

      let upsertData, upsertError;

      if (existingProfile) {
        // Update existing profile
        console.log('Updating existing profile');
        const { data, error } = await supabaseServer
          .from('user_profiles')
          .update(profileData)
          .eq('id', user.id)
          .select();

        upsertData = data;
        upsertError = error;
      } else {
        // Insert new profile
        console.log('Creating new profile');
        const { data, error } = await supabaseServer
          .from('user_profiles')
          .insert(profileData)
          .select();

        upsertData = data;
        upsertError = error;
      }

      if (upsertError) {
        console.error('Upsert error:', upsertError);
        return NextResponse.json(
          { error: 'Failed to update profile', details: upsertError.message },
          { status: 500 }
        );
      }

      if (!upsertData || upsertData.length === 0) {
        console.error('Upsert succeeded but no data returned');

        // Try to fetch the profile to return it
        const { data: fetchedProfile, error: fetchError } = await supabaseServer
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (fetchError) {
          console.error('Error fetching profile after upsert:', fetchError);
          return NextResponse.json(
            { error: 'Profile updated but failed to fetch the updated profile' },
            { status: 500 }
          );
        }

        console.log('Profile fetched after upsert');
        return NextResponse.json({
          success: true,
          profile: fetchedProfile
        });
      }

      console.log('Profile upsert successful');
      return NextResponse.json({
        success: true,
        profile: upsertData[0]
      });
    } catch (upsertErr) {
      console.error('Exception during profile upsert:', upsertErr);
      return NextResponse.json(
        { error: 'Exception during profile update: ' + (upsertErr.message || 'Unknown error') },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Exception in basic update profile API:', error);
    return NextResponse.json(
      { error: 'Failed to update profile: ' + (error.message || 'Unknown error') },
      { status: 500 }
    );
  }
}
