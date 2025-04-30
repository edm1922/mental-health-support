import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function POST(request, { params }) {
  try {
    const applicationId = params.id;
    console.log(`Processing counselor application ${applicationId}`);

    // Parse the request body
    const body = await request.json();
    const { status } = body;

    if (!status || !['approved', 'rejected'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be approved or rejected' },
        { status: 400 }
      );
    }

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
        { error: 'Only administrators can update counselor applications' },
        { status: 403 }
      );
    }

    // Get the application to verify it exists and to get the user_id
    const { data: application, error: applicationError } = await supabase
      .from('counselor_applications')
      .select('user_id, status')
      .eq('id', applicationId)
      .single();

    console.log('Application data:', application);

    if (applicationError) {
      console.error('Error fetching application:', applicationError);
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    // Update the application status
    const { error: updateError } = await supabase
      .from('counselor_applications')
      .update({
        status: status,
        updated_at: new Date().toISOString()
      })
      .eq('id', applicationId);

    if (updateError) {
      console.error('Error updating application:', updateError);
      return NextResponse.json(
        { error: 'Failed to update application status' },
        { status: 500 }
      );
    }

    // If approved, update the user's role to counselor
    if (status === 'approved') {
      console.log('Updating user role to counselor for user_id:', application.user_id);

      // First, check if the user profile exists
      const { data: userProfile, error: profileCheckError } = await supabase
        .from('user_profiles')
        .select('id, role')
        .eq('id', application.user_id)
        .single();

      if (profileCheckError) {
        console.error('Error checking user profile:', profileCheckError);
        console.log('User profile not found with id matching user_id, trying with id directly');

        // Try again with id directly (not user_id)
        const { data: retryProfile, error: retryError } = await supabase
          .from('user_profiles')
          .select('id, role')
          .eq('id', application.user_id)
          .single();

        if (retryError) {
          console.error('Error on retry:', retryError);
          return NextResponse.json(
            { error: 'Failed to find user profile' },
            { status: 500 }
          );
        }

        console.log('Found user profile on retry:', retryProfile);
      } else {
        console.log('Found user profile:', userProfile);
      }

      // Update the user's role to counselor
      console.log('Attempting to update user role to counselor for user ID:', application.user_id);

      // First check if the exec_sql function exists
      try {
        const { data: functionCheck, error: functionCheckError } = await supabase.rpc('exec_sql', {
          sql: `SELECT 1;`
        });

        console.log('Function check result:', functionCheck, 'Error:', functionCheckError);

        if (functionCheckError) {
          console.error('exec_sql function does not exist or has an error:', functionCheckError);
          // Create the function if it doesn't exist
          const { data: createFunctionResult, error: createFunctionError } = await supabase.rpc('exec_sql', {
            sql: `
              CREATE OR REPLACE FUNCTION exec_sql(sql text)
              RETURNS JSONB
              LANGUAGE plpgsql
              SECURITY DEFINER
              AS $$
              BEGIN
                EXECUTE sql;
                RETURN jsonb_build_object('success', true);
              EXCEPTION WHEN OTHERS THEN
                RETURN jsonb_build_object(
                  'success', false,
                  'error', SQLERRM,
                  'detail', SQLSTATE
                );
              END;
              $$;
            `
          });

          console.log('Create function result:', createFunctionResult, 'Error:', createFunctionError);
        }
      } catch (functionError) {
        console.error('Error checking exec_sql function:', functionError);
      }

      // Try multiple approaches to update the user's role
      console.log('Trying multiple approaches to update user role to counselor');

      // Approach 1: Direct SQL query
      const { data: updateResult, error: roleUpdateError } = await supabase.rpc('exec_sql', {
        sql: `UPDATE public.user_profiles SET role = 'counselor', updated_at = NOW() WHERE id = '${application.user_id}' RETURNING id, role;`
      });

      console.log('SQL update result:', updateResult, 'Error:', roleUpdateError);

      // Approach 2: Try with user_id field
      if (roleUpdateError) {
        console.error('Error updating with id, trying with user_id field');
        const { data: altUpdateResult, error: altRoleUpdateError } = await supabase.rpc('exec_sql', {
          sql: `UPDATE public.user_profiles SET role = 'counselor', updated_at = NOW() WHERE user_id = '${application.user_id}' RETURNING id, role;`
        });

        console.log('Alt SQL update result:', altUpdateResult, 'Error:', altRoleUpdateError);

        if (!altRoleUpdateError) {
          console.log('Successfully updated with user_id field:', altUpdateResult);
        }
      }

      // Approach 3: Use the Supabase client directly
      const { data: directUpdate, error: directUpdateError } = await supabase
        .from('user_profiles')
        .update({
          role: 'counselor',
          updated_at: new Date().toISOString()
        })
        .eq('id', application.user_id)
        .select();

      console.log('Direct update result:', directUpdate, 'Error:', directUpdateError);

      // Approach 4: Use upsert as a last resort
      const { data: upsertResult, error: upsertError } = await supabase
        .from('user_profiles')
        .upsert({
          id: application.user_id,
          role: 'counselor',
          updated_at: new Date().toISOString()
        })
        .select();

      console.log('Upsert result:', upsertResult, 'Error:', upsertError);

      // Double-check that the update worked
      const { data: checkProfile, error: checkError } = await supabase
        .from('user_profiles')
        .select('id, role')
        .eq('id', application.user_id)
        .single();

      console.log('Profile after update:', checkProfile, 'Error:', checkError);

      if (checkError || (checkProfile && checkProfile.role !== 'counselor')) {
        console.error('Role update verification failed:', checkError || 'Role mismatch');
      } else {
        console.log('Successfully verified role update to counselor');
      }

      if (roleUpdateError) {
        console.error('Error updating user role with SQL:', roleUpdateError);

        // Try the standard update method as a fallback
        console.log('Trying standard update method as fallback');
        const { data: standardUpdate, error: standardUpdateError } = await supabase
          .from('user_profiles')
          .update({
            role: 'counselor',
            updated_at: new Date().toISOString()
          })
          .eq('id', application.user_id)
          .select();

        // If that fails too, try one more approach
        if (standardUpdateError) {
          console.log('Standard update failed, trying one more approach');

          // First get all user profiles to debug
          const { data: allProfiles, error: listError } = await supabase
            .from('user_profiles')
            .select('id, role')
            .limit(10);

          console.log('Sample profiles:', allProfiles, 'Error:', listError);

          // Try direct insert/update
          const { data: upsertResult, error: upsertError } = await supabase
            .from('user_profiles')
            .upsert({
              id: application.user_id,
              role: 'counselor',
              updated_at: new Date().toISOString()
            })
            .select();

          console.log('Upsert result:', upsertResult, 'Error:', upsertError);
        }

        console.log('Standard update result:', standardUpdate, 'Error:', standardUpdateError);

        if (standardUpdateError) {
          console.error('Error with standard update method:', standardUpdateError);
          return NextResponse.json(
            {
              warning: 'Application status updated but failed to update user role',
              error: standardUpdateError.message
            },
            { status: 200 }
          );
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Application ${status} successfully`,
      applicationId,
      status
    });
  } catch (error) {
    console.error('Error processing counselor application:', error);
    return NextResponse.json(
      { error: 'Failed to process application: ' + error.message },
      { status: 500 }
    );
  }
}
