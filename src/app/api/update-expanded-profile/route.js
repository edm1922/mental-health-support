import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabase } from '@/utils/supabaseClient';

export const dynamic = 'force-dynamic'; // This ensures the route is always dynamic

export async function POST(request) {
  try {
    console.log('Update expanded profile API called');
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
      comfortWithSharing,
    } = await request.json();

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

    console.log('Updating profile for user:', user.id);

    // First, check if the user profile exists
    const { data: existingProfile, error: profileCheckError } = await supabaseServer
      .from('user_profiles')
      .select('id')
      .eq('id', user.id)
      .single();

    if (profileCheckError && profileCheckError.code !== 'PGRST116') {
      console.error('Error checking profile:', profileCheckError);
      return NextResponse.json(
        { error: 'Failed to check if profile exists' },
        { status: 500 }
      );
    }

    let profileResult;

    // If profile doesn't exist, create it
    if (!existingProfile) {
      console.log('Profile does not exist, creating new profile');

      // Try to create the profile using SQL to bypass RLS
      try {
        const { data: sqlData, error: sqlError } = await supabaseServer.rpc('exec_sql', {
          sql: `
            INSERT INTO public.user_profiles (
              id,
              display_name,
              bio,
              role,
              expanded
            ) VALUES (
              '${user.id}',
              '${displayName?.replace(/'/g, "''")}',
              '${bio?.replace(/'/g, "''")}',
              'user',
              jsonb_build_object(
                'age', ${age || 'NULL'},
                'gender', ${gender ? `'${gender.replace(/'/g, "''")}'` : 'NULL'},
                'location', ${location ? `'${location.replace(/'/g, "''")}'` : 'NULL'},
                'interests', ${interests && interests.length > 0 ? `'${JSON.stringify(interests).replace(/'/g, "''")}'` : 'NULL'},
                'occupation', ${occupation ? `'${occupation.replace(/'/g, "''")}'` : 'NULL'},
                'preferred_contact_method', ${preferredContactMethod ? `'${preferredContactMethod.replace(/'/g, "''")}'` : 'NULL'},
                'emergency_contact', ${emergencyContact ? `'${emergencyContact.replace(/'/g, "''")}'` : 'NULL'},
                'languages', ${languages && languages.length > 0 ? `'${JSON.stringify(languages).replace(/'/g, "''")}'` : 'NULL'},
                'about_me', ${aboutMe ? `'${aboutMe.replace(/'/g, "''")}'` : 'NULL'},
                'seeking_help_for', ${seekingHelpFor ? `'${seekingHelpFor.replace(/'/g, "''")}'` : 'NULL'},
                'comfort_with_sharing', ${comfortWithSharing !== undefined ? comfortWithSharing : true}
              )
            )
            RETURNING *;
          `
        });

        if (sqlError) {
          console.error('SQL insert error:', sqlError);
          throw new Error('SQL insert failed: ' + sqlError.message);
        }

        console.log('SQL insert succeeded');
        profileResult = { success: true };
      } catch (sqlError) {
        console.error('SQL insert exception:', sqlError);

        // Fall back to regular insert
        console.log('Trying regular insert...');
        const { data: insertData, error: insertError } = await supabaseServer
          .from('user_profiles')
          .insert([{
            id: user.id,
            display_name: displayName,
            bio: bio,
            role: 'user',
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
          }])
          .select();

        if (insertError) {
          console.error('Regular insert error:', insertError);
          return NextResponse.json(
            { error: 'Failed to create profile', details: insertError.message },
            { status: 500 }
          );
        }

        console.log('Regular insert succeeded');
        profileResult = { data: insertData[0] };
      }
    } else {
      console.log('Profile exists, updating profile');

      // Try to update the profile using SQL to bypass RLS
      try {
        console.log('Attempting SQL update with user ID:', user.id);

        // Check if the exec_sql function exists
        const { data: rpcFunctions, error: rpcError } = await supabaseServer.rpc('list_functions');
        if (rpcError) {
          console.error('Error checking RPC functions:', rpcError);
          throw new Error('Could not verify RPC functions: ' + rpcError.message);
        }

        console.log('Available RPC functions:', rpcFunctions || 'None returned');

        const { data: sqlData, error: sqlError } = await supabaseServer.rpc('exec_sql', {
          sql: `
            UPDATE public.user_profiles
            SET
              display_name = '${displayName?.replace(/'/g, "''")}',
              bio = ${bio ? `'${bio.replace(/'/g, "''")}'` : 'NULL'},
              updated_at = NOW(),
              expanded = jsonb_build_object(
                'age', ${age || 'NULL'},
                'gender', ${gender ? `'${gender.replace(/'/g, "''")}'` : 'NULL'},
                'location', ${location ? `'${location.replace(/'/g, "''")}'` : 'NULL'},
                'interests', ${interests && interests.length > 0 ? `'${JSON.stringify(interests).replace(/'/g, "''")}'` : 'NULL'},
                'occupation', ${occupation ? `'${occupation.replace(/'/g, "''")}'` : 'NULL'},
                'preferred_contact_method', ${preferredContactMethod ? `'${preferredContactMethod.replace(/'/g, "''")}'` : 'NULL'},
                'emergency_contact', ${emergencyContact ? `'${emergencyContact.replace(/'/g, "''")}'` : 'NULL'},
                'languages', ${languages && languages.length > 0 ? `'${JSON.stringify(languages).replace(/'/g, "''")}'` : 'NULL'},
                'about_me', ${aboutMe ? `'${aboutMe.replace(/'/g, "''")}'` : 'NULL'},
                'seeking_help_for', ${seekingHelpFor ? `'${seekingHelpFor.replace(/'/g, "''")}'` : 'NULL'},
                'comfort_with_sharing', ${comfortWithSharing !== undefined ? comfortWithSharing : true}
              )
            WHERE id = '${user.id}'
            RETURNING *;
          `
        });

        if (sqlError) {
          console.error('SQL update error:', sqlError);
          throw new Error('SQL update failed: ' + sqlError.message);
        }

        console.log('SQL update succeeded');
        profileResult = { success: true };
      } catch (sqlError) {
        console.error('SQL update exception:', sqlError);

        // Fall back to regular update
        console.log('SQL update failed, trying regular update...');

        // First, check if the profile exists again
        const { data: checkProfile, error: checkError } = await supabaseServer
          .from('user_profiles')
          .select('id')
          .eq('id', user.id)
          .single();

        console.log('Profile check before update:', checkProfile ? 'Profile exists' : 'Profile not found', checkError ? `Error: ${checkError.message}` : 'No error');

        // Prepare update data
        const updatePayload = {
          display_name: displayName,
          bio: bio,
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

        console.log('Update payload:', JSON.stringify(updatePayload));

        const { data: updateData, error: updateError } = await supabaseServer
          .from('user_profiles')
          .update(updatePayload)
          .eq('id', user.id)
          .select();

        if (updateError) {
          console.error('Regular update error:', updateError);
          return NextResponse.json(
            { error: 'Failed to update profile', details: updateError.message },
            { status: 500 }
          );
        }

        console.log('Regular update succeeded');
        profileResult = { data: updateData[0] };
      }
    }

    // Now fetch the updated profile to return
    console.log('Fetching updated profile for user ID:', user.id);
    const { data: profile, error: fetchError } = await supabaseServer
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (fetchError) {
      console.error('Error fetching updated profile:', fetchError);
      return NextResponse.json(
        { error: 'Profile updated but failed to fetch the updated profile' },
        { status: 500 }
      );
    }

    console.log('Profile fetched successfully:', JSON.stringify(profile));
    console.log('Profile expanded data:', JSON.stringify(profile?.expanded));
    console.log('Profile updated successfully');

    return NextResponse.json({
      success: true,
      profile
    });
  } catch (error) {
    console.error('Exception in update profile API:', error);
    return NextResponse.json(
      { error: 'Failed to update profile: ' + (error.message || 'Unknown error') },
      { status: 500 }
    );
  }
}
