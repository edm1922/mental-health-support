import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic'; // This ensures the route is always dynamic

export async function POST(request) {
  try {
    console.log('Update last active API called');

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

    // Set the auth token to bypass RLS
    await supabase.auth.setSession({ access_token: token, refresh_token: '' });

    // Get the current user using the token
    console.log('Getting user from token');
    const { data: userData, error: sessionError } = await supabase.auth.getUser(token);

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

    // Check if profile exists
    const { data: existingProfile, error: checkError } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('id', user.id.toString())
      .maybeSingle();

    if (checkError) {
      console.error('Error checking if profile exists:', checkError);
      return NextResponse.json(
        { error: 'Failed to check if profile exists', details: checkError.message },
        { status: 500 }
      );
    }

    console.log('Profile exists check result:', existingProfile ? 'Yes' : 'No');

    if (existingProfile) {
      // Update last_active timestamp
      console.log('Updating last_active timestamp');
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({
          last_active: new Date().toISOString()
        })
        .eq('id', user.id.toString());

      if (updateError) {
        console.error('Error updating last_active:', updateError);
        return NextResponse.json(
          { error: 'Failed to update last_active', details: updateError.message },
          { status: 500 }
        );
      }

      console.log('Last active timestamp updated successfully');
      return NextResponse.json({
        success: true,
        message: 'Last active timestamp updated'
      });
    } else {
      // Create profile with last_active timestamp
      console.log('Creating profile with last_active timestamp');
      const { error: createError } = await supabase
        .from('user_profiles')
        .insert({
          id: user.id.toString(),
          display_name: user.email?.split('@')[0] || 'User',
          bio: '',
          role: 'user',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          last_active: new Date().toISOString()
        });

      if (createError) {
        console.error('Error creating profile:', createError);
        return NextResponse.json(
          { error: 'Failed to create profile', details: createError.message },
          { status: 500 }
        );
      }

      console.log('Profile created with last_active timestamp');
      return NextResponse.json({
        success: true,
        message: 'Profile created with last_active timestamp'
      });
    }
  } catch (error) {
    console.error('Exception in update last active API:', error);
    return NextResponse.json(
      { error: 'Failed to update last_active: ' + (error.message || 'Unknown error') },
      { status: 500 }
    );
  }
}
