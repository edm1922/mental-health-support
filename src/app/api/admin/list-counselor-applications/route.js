import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required' },
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
        { error: 'Server configuration error' },
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
        { error: 'Authentication error' },
        { status: 401 }
      );
    }

    // Verify the user is an admin
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', userData.user.id)
      .single();

    if (profileError) {
      console.error('Error fetching user profile:', profileError);
      return NextResponse.json(
        { error: 'Failed to verify admin status' },
        { status: 500 }
      );
    }

    if (userProfile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only administrators can view counselor applications' },
        { status: 403 }
      );
    }

    console.log('Fetching counselor applications');

    // Get all counselor applications
    const { data: applications, error: applicationsError } = await supabase
      .from('counselor_applications')
      .select('*')
      .order('created_at', { ascending: false });

    if (applicationsError) {
      console.error('Error fetching applications:', applicationsError);
      return NextResponse.json(
        { error: 'Failed to fetch counselor applications: ' + applicationsError.message },
        { status: 500 }
      );
    }

    console.log('Applications fetched:', applications?.length || 0);

    // Get user profiles for each application
    let enhancedApplications = applications || [];

    if (applications && applications.length > 0) {
      try {
        // Get user profiles for all applications
        const userIds = applications.map(app => app.user_id).filter(Boolean);

        if (userIds.length > 0) {
          console.log('Fetching user profiles for', userIds.length, 'users');

          const { data: profiles, error: profilesError } = await supabase
            .from('user_profiles')
            .select('id, display_name, email')
            .in('id', userIds);

          if (profilesError) {
            console.error('Error fetching user profiles:', profilesError);
          } else if (profiles && profiles.length > 0) {
            console.log('User profiles fetched:', profiles.length);

            // Create a map of user IDs to profiles
            const profileMap = profiles.reduce((map, profile) => {
              map[profile.id] = profile;
              return map;
            }, {});

            // Enhance applications with user profile data
            enhancedApplications = applications.map(app => ({
              ...app,
              display_name: profileMap[app.user_id]?.display_name || 'Unknown',
              email: profileMap[app.user_id]?.email || 'Unknown'
            }));
          }
        }
      } catch (err) {
        console.error('Error enhancing applications with profiles:', err);
      }
    }

    return NextResponse.json({
      success: true,
      applications: enhancedApplications
    });
  } catch (error) {
    console.error('Error listing counselor applications:', error);
    return NextResponse.json(
      { error: 'Failed to list applications: ' + error.message },
      { status: 500 }
    );
  }
}
