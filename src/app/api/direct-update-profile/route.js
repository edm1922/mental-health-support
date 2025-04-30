import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic'; // This ensures the route is always dynamic

export async function POST(request) {
  try {
    console.log('Direct update profile API called');
    
    // Get the request data
    const requestData = await request.json();
    console.log('Request data received');
    
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
    const supabaseServer = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://euebogudyyeodzkvhyef.supabase.co',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV1ZWJvZ3VkeXllb2R6a3ZoeWVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4NjM5NDgsImV4cCI6MjA2MDQzOTk0OH0.b68JOxrpuFwWb2K3DraYvv32uqomvK0r1imbOCG0HKc'
    );

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
    const { 
      displayName, 
      bio, 
      age, 
      gender, 
      location, 
      interests, 
      occupation, 
      preferredContactMethod, 
      emergencyContact, 
      languages, 
      aboutMe, 
      seekingHelpFor, 
      comfortWithSharing 
    } = requestData;

    // Prepare the profile data
    const profileData = {
      id: user.id,
      display_name: displayName || null,
      bio: bio || null,
      role: 'user',
      updated_at: new Date().toISOString(),
      expanded: {
        age: age || null,
        gender: gender || null,
        location: location || null,
        interests: interests || [],
        occupation: occupation || null,
        preferred_contact_method: preferredContactMethod || null,
        emergency_contact: emergencyContact || null,
        languages: languages || [],
        about_me: aboutMe || null,
        seeking_help_for: seekingHelpFor || null,
        comfort_with_sharing: comfortWithSharing !== undefined ? comfortWithSharing : true
      }
    };

    console.log('Profile data prepared:', JSON.stringify(profileData));

    // Try to use upsert to either insert or update the profile
    try {
      console.log('Attempting upsert operation');
      const { data: upsertData, error: upsertError } = await supabaseServer
        .from('user_profiles')
        .upsert(profileData, { 
          onConflict: 'id',
          returning: 'representation'
        })
        .select();

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
    console.error('Exception in direct update profile API:', error);
    return NextResponse.json(
      { error: 'Failed to update profile: ' + (error.message || 'Unknown error') },
      { status: 500 }
    );
  }
}
