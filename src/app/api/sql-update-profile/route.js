import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic'; // This ensures the route is always dynamic

export async function POST(request) {
  try {
    console.log('SQL update profile API called');
    
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

    // Try to use direct SQL to update the profile
    try {
      console.log('Attempting direct SQL operation');
      
      // First check if the profile exists
      const { count, error: countError } = await supabaseServer.rpc('profile_exists', { 
        user_id: user.id 
      });
      
      if (countError) {
        console.error('Error checking if profile exists:', countError);
        return NextResponse.json(
          { error: 'Failed to check if profile exists', details: countError.message },
          { status: 500 }
        );
      }
      
      console.log('Profile exists check result:', count);
      
      let result, error;
      
      if (count > 0) {
        // Update existing profile using RPC
        console.log('Updating existing profile with RPC');
        const response = await supabaseServer.rpc('update_user_profile', { 
          user_id: user.id,
          display_name_param: displayName || null,
          bio_param: bio || null
        });
        
        error = response.error;
        result = response.data;
      } else {
        // Insert new profile using RPC
        console.log('Creating new profile with RPC');
        const response = await supabaseServer.rpc('create_user_profile', { 
          user_id: user.id,
          display_name_param: displayName || null,
          bio_param: bio || null
        });
        
        error = response.error;
        result = response.data;
      }

      if (error) {
        console.error('SQL operation error:', error);
        return NextResponse.json(
          { error: 'Failed to update profile', details: error.message },
          { status: 500 }
        );
      }

      // Fetch the updated profile
      const { data: profile, error: fetchError } = await supabaseServer
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();
        
      if (fetchError) {
        console.error('Error fetching profile after update:', fetchError);
        return NextResponse.json(
          { error: 'Profile updated but failed to fetch the updated profile' },
          { status: 500 }
        );
      }
      
      console.log('Profile operation successful');
      return NextResponse.json({
        success: true,
        profile: profile
      });
    } catch (sqlErr) {
      console.error('Exception during SQL operation:', sqlErr);
      return NextResponse.json(
        { error: 'Exception during profile update: ' + (sqlErr.message || 'Unknown error') },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Exception in SQL update profile API:', error);
    return NextResponse.json(
      { error: 'Failed to update profile: ' + (error.message || 'Unknown error') },
      { status: 500 }
    );
  }
}
