import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request) {
  try {
    console.log('Mental health check-in API called');

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

    // Extract check-in data from request
    const { moodRating, notes } = requestData;

    // Validate mood rating
    if (!moodRating || typeof moodRating !== 'number' || moodRating < 1 || moodRating > 5) {
      console.error('Invalid mood rating:', moodRating);
      return NextResponse.json(
        { error: 'Mood rating must be a number between 1 and 5' },
        { status: 400 }
      );
    }

    // Insert the check-in
    console.log('Inserting check-in for user:', user.id.toString());

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
    console.log('User ID for check-in:', userId, 'Type:', typeof userId);

    // Prepare the data to insert
    const insertData = {
      user_id: userId,
      mood_rating: moodRating,
      notes: notes || null
    };
    console.log('Insert data:', JSON.stringify(insertData));

    // Try to get table info first to debug
    const { data: tableInfo, error: tableError } = await supabase
      .from('mental_health_checkins')
      .select('*')
      .limit(1);

    if (tableError) {
      console.error('Error checking table structure:', tableError);
      // Continue anyway to see the specific insert error
    } else {
      console.log('Table first row sample:', tableInfo);
    }

    // Insert with the correct column names
    const { data: checkin, error: insertError } = await supabase
      .from('mental_health_checkins')
      .insert(insertData)
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting check-in:', insertError);
      return NextResponse.json(
        { error: 'Failed to save check-in', details: insertError.message },
        { status: 500 }
      );
    }

    console.log('Check-in saved successfully:', checkin);
    return NextResponse.json({
      success: true,
      checkin
    });
  } catch (error) {
    console.error('Exception in mental health check-in API:', error);
    return NextResponse.json(
      { error: 'Failed to save check-in: ' + (error.message || 'Unknown error') },
      { status: 500 }
    );
  }
}
