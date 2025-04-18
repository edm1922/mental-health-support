import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic'; // This ensures the route is always dynamic

export async function POST(request) {
  try {
    console.log('Simple update profile API called');
    const requestData = await request.json();
    console.log('Request data:', JSON.stringify(requestData));

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
    const { data, error: sessionError } = await supabaseServer.auth.getUser(token);
    const user = data?.user;

    console.log('User data:', user ? `User found: ${user.id}` : 'No user');

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

    // Extract profile data from request
    const {
      displayName,
      bio,
      preferredContactMethod,
      // Mental health fields
      mentalHealthInterests,
      supportPreferences,
      comfortLevelSharing,
      emergencyContact,
      goals,
      preferredResources,
      triggers,
      copingStrategies,
      // Counselor fields
      credentials,
      yearsExperience,
      specializations,
      availabilityHours,
      professionalBio
    } = requestData;

    // First get the user's role
    const { data: profileData, error: profileError } = await supabaseServer
      .from('user_profiles')
      .select('role')
      .eq('id', user.id.toString())
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Error fetching user role:', profileError);
      return NextResponse.json(
        { error: 'Failed to fetch user role', details: profileError.message },
        { status: 500 }
      );
    }

    const isCounselor = profileData?.role === 'counselor';
    const isAdmin = profileData?.role === 'admin';
    console.log('User role:', isAdmin ? 'admin' : (isCounselor ? 'counselor' : 'user'));

    // Prepare the update payload based on user role
    let updatePayload = {
      display_name: displayName || null,
      bio: bio || null,
      preferred_contact_method: preferredContactMethod || 'app',
      updated_at: new Date().toISOString(),
      // Update last_active timestamp
      last_active: new Date().toISOString()
    };

    // Add role-specific fields
    if (isAdmin) {
      // Admin only needs basic fields, which are already in updatePayload
    } else if (isCounselor) {
      // Add counselor-specific fields
      updatePayload = {
        ...updatePayload,
        credentials: credentials || null,
        years_experience: yearsExperience || null,
        specializations: specializations || [],
        availability_hours: availabilityHours || null,
        professional_bio: professionalBio || null
      };
    } else {
      // Add mental health fields for regular users
      updatePayload = {
        ...updatePayload,
        mental_health_interests: mentalHealthInterests || [],
        support_preferences: supportPreferences || [],
        comfort_level_sharing: comfortLevelSharing || 'moderate',
        emergency_contact: emergencyContact || null,
        goals: goals || null,
        preferred_resources: preferredResources || [],
        triggers: triggers || [],
        coping_strategies: copingStrategies || []
      };
    };

    console.log('Update payload:', JSON.stringify(updatePayload));

    // First check if the profile exists
    console.log('Checking if profile exists for user ID:', user.id);
    let existingProfile = null;
    let checkError = null;

    try {
      const result = await supabaseServer
        .from('user_profiles')
        .select('id')
        .eq('id', user.id.toString())
        .single();

      existingProfile = result.data;
      checkError = result.error;

      console.log('Profile check result:', result);
      console.log('Profile check:', existingProfile ? 'Profile exists' : 'Profile not found', checkError ? `Error: ${checkError.message}` : 'No error');
    } catch (err) {
      console.error('Exception during profile check:', err);
      checkError = err;
    }

    let result;

    if (!existingProfile) {
      // Create new profile
      console.log('Creating new profile');
      try {
        // Base insert payload
        let insertPayload = {
          id: user.id.toString(),
          display_name: displayName || null,
          bio: bio || null,
          role: isAdmin ? 'admin' : (isCounselor ? 'counselor' : 'user'),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          preferred_contact_method: preferredContactMethod || 'app',
          // Include last_active timestamp
          last_active: new Date().toISOString()
        };

        // Add role-specific fields
        if (isAdmin) {
          // Admin only needs basic fields, which are already in insertPayload
        } else if (isCounselor) {
          // Add counselor-specific fields
          insertPayload = {
            ...insertPayload,
            credentials: credentials || null,
            years_experience: yearsExperience || null,
            specializations: specializations || [],
            availability_hours: availabilityHours || null,
            professional_bio: professionalBio || null
          };
        } else {
          // Add mental health fields for regular users
          insertPayload = {
            ...insertPayload,
            mental_health_interests: mentalHealthInterests || [],
            support_preferences: supportPreferences || [],
            comfort_level_sharing: comfortLevelSharing || 'moderate',
            emergency_contact: emergencyContact || null,
            goals: goals || null,
            preferred_resources: preferredResources || [],
            triggers: triggers || [],
            coping_strategies: copingStrategies || []
          };
        };
        console.log('Insert payload:', JSON.stringify(insertPayload));

        const insertResult = await supabaseServer
          .from('user_profiles')
          .insert([insertPayload])
          .select();

        console.log('Insert result:', insertResult);

        if (insertResult.error) {
          console.error('Insert error:', insertResult.error);
          return NextResponse.json(
            { error: 'Failed to create profile', details: insertResult.error.message },
            { status: 500 }
          );
        }

        if (!insertResult.data || insertResult.data.length === 0) {
          console.error('Insert succeeded but no data returned');
          return NextResponse.json(
            { error: 'Profile created but no data returned' },
            { status: 500 }
          );
        }

        console.log('Profile created successfully');
        result = insertResult.data[0];
      } catch (insertErr) {
        console.error('Exception during profile creation:', insertErr);
        return NextResponse.json(
          { error: 'Exception during profile creation: ' + (insertErr.message || 'Unknown error') },
          { status: 500 }
        );
      }
    } else {
      // Update existing profile
      console.log('Updating existing profile');
      try {
        console.log('Update payload:', JSON.stringify(updatePayload));

        const updateResult = await supabaseServer
          .from('user_profiles')
          .update(updatePayload)
          .eq('id', user.id.toString())
          .select();

        console.log('Update result:', updateResult);

        if (updateResult.error) {
          console.error('Update error:', updateResult.error);
          return NextResponse.json(
            { error: 'Failed to update profile', details: updateResult.error.message },
            { status: 500 }
          );
        }

        if (!updateResult.data || updateResult.data.length === 0) {
          console.error('Update succeeded but no data returned');
          return NextResponse.json(
            { error: 'Profile updated but no data returned' },
            { status: 500 }
          );
        }

        console.log('Profile updated successfully');
        console.log('Updated profile data:', JSON.stringify(updateResult.data[0]));
        result = updateResult.data[0];
      } catch (updateErr) {
        console.error('Exception during profile update:', updateErr);
        return NextResponse.json(
          { error: 'Exception during profile update: ' + (updateErr.message || 'Unknown error') },
          { status: 500 }
        );
      }
    }

    // Return the updated profile
    return NextResponse.json({
      success: true,
      profile: result
    });
  } catch (error) {
    console.error('Exception in update profile API:', error);
    return NextResponse.json(
      { error: 'Failed to update profile: ' + (error.message || 'Unknown error') },
      { status: 500 }
    );
  }
}
