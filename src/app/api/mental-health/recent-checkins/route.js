import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request) {
  try {
    console.log('Recent check-ins API called');

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

    // Fetch recent check-ins for the user
    console.log('Fetching recent check-ins for user:', user.id.toString());

    // Try to get table info first to debug
    const { data: tableInfo, error: tableError } = await supabase
      .from('mental_health_checkins')
      .select('*')
      .limit(1);

    if (tableError) {
      console.error('Error checking table structure:', tableError);
    } else {
      console.log('Table first row sample:', tableInfo);
      // Log column names to help debug
      if (tableInfo && tableInfo.length > 0) {
        console.log('Column names:', Object.keys(tableInfo[0]));
      }
    }

    // Make sure we have a valid user ID
    if (!user || !user.id) {
      console.error('Invalid user object or missing ID');
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Log the user ID for debugging
    const userId = user.id.toString();
    console.log('User ID for fetching check-ins:', userId, 'Type:', typeof userId);

    // Try to fetch check-ins with user_id filter
    let { data: checkins, error: fetchError } = await supabase
      .from('mental_health_checkins')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    // If no check-ins found, try fetching all and filtering in code
    // This is a fallback in case the user_id column isn't being used correctly
    if ((!checkins || checkins.length === 0) && !fetchError) {
      console.log('No check-ins found with user_id filter, trying to fetch all');
      ({ data: checkins, error: fetchError } = await supabase
        .from('mental_health_checkins')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50));

      // Filter the results in code
      if (checkins && checkins.length > 0) {
        console.log(`Retrieved ${checkins.length} total check-ins, filtering for current user`);
        // Keep only check-ins where user_id matches or is null (for testing)
        checkins = checkins.filter(c => c.user_id === userId || c.user_id === null);
        console.log(`After filtering: ${checkins.length} check-ins`);
      }
    }

    if (fetchError) {
      console.error('Error fetching check-ins:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch check-ins', details: fetchError.message },
        { status: 500 }
      );
    }

    console.log(`Retrieved ${checkins?.length || 0} check-ins`);
    return NextResponse.json(checkins || []);
  } catch (error) {
    console.error('Exception in recent check-ins API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch check-ins: ' + (error.message || 'Unknown error') },
      { status: 500 }
    );
  }
}
