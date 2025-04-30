import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabase } from '@/utils/supabaseClient';

export const dynamic = 'force-dynamic'; // This ensures the route is always dynamic

export async function POST(request) {
  try {
    console.log('Get expanded profile API called');

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

    // Create a server-side client with the token
    const supabaseServer = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://euebogudyyeodzkvhyef.supabase.co',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV1ZWJvZ3VkeXllb2R6a3ZoeWVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4NjM5NDgsImV4cCI6MjA2MDQzOTk0OH0.b68JOxrpuFwWb2K3DraYvv32uqomvK0r1imbOCG0HKc'
    );

    // Get the current user using the token
    const { data, error: sessionError } = await supabaseServer.auth.getUser(token);
    const user = data?.user;

    console.log('User data:', user ? 'User found' : 'No user');

    if (sessionError) {
      console.error('Auth error:', sessionError);
      return NextResponse.json(
        { error: 'Authentication error: ' + sessionError.message },
        { status: 401 }
      );
    }

    if (!user) {
      console.error('No authenticated user found');
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in' },
        { status: 401 }
      );
    }

    console.log('Getting profile for user:', user.id);

    // Fetch the user profile
    const { data: profile, error: profileError } = await supabaseServer
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);

      // If the profile doesn't exist, return an empty profile
      if (profileError.code === 'PGRST116') {
        return NextResponse.json({
          id: user.id,
          display_name: user.user_metadata?.display_name || user.email?.split('@')[0],
          role: 'user',
          expanded: {}
        });
      }

      return NextResponse.json(
        { error: 'Failed to fetch profile', details: profileError.message },
        { status: 500 }
      );
    }

    console.log('Profile fetched successfully');
    return NextResponse.json(profile);
  } catch (error) {
    console.error('Exception in get profile API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile: ' + (error.message || 'Unknown error') },
      { status: 500 }
    );
  }
}
