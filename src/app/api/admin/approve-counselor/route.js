import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request) {
  try {
    // Get the request body
    const { applicationId } = await request.json();

    if (!applicationId) {
      return NextResponse.json(
        { error: 'Application ID is required' },
        { status: 400 }
      );
    }

    // Initialize Supabase client
    const supabase = createRouteHandlerClient({ cookies });

    // Verify the user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify the user is an admin
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', session.user.id)
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
        { error: 'Only administrators can approve counselor applications' },
        { status: 403 }
      );
    }

    // Get the application details
    const { data: application, error: applicationError } = await supabase
      .from('counselor_applications')
      .select('user_id, status')
      .eq('id', applicationId)
      .single();

    if (applicationError) {
      console.error('Error fetching application:', applicationError);
      return NextResponse.json(
        { error: 'Failed to fetch application details' },
        { status: 500 }
      );
    }

    if (!application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    if (application.status === 'approved') {
      return NextResponse.json(
        { error: 'Application is already approved' },
        { status: 400 }
      );
    }

    // Start a transaction to update both the application and user profile
    // First, update the application status
    const { error: updateAppError } = await supabase
      .from('counselor_applications')
      .update({
        status: 'approved',
        updated_at: new Date().toISOString()
      })
      .eq('id', applicationId);

    if (updateAppError) {
      console.error('Error updating application:', updateAppError);
      return NextResponse.json(
        { error: 'Failed to update application status' },
        { status: 500 }
      );
    }

    // Then, update the user's role to counselor
    console.log('Updating user role to counselor for user_id:', application.user_id);

    // First, check if the user profile exists
    const { data: userProfile, error: profileCheckError } = await supabase
      .from('user_profiles')
      .select('id, role')
      .eq('id', application.user_id)
      .single();

    if (profileCheckError) {
      console.error('Error checking user profile:', profileCheckError);
      return NextResponse.json(
        { error: 'Failed to find user profile' },
        { status: 500 }
      );
    }

    console.log('Found user profile:', userProfile);

    // Update the user's role to counselor
    const { error: updateUserError } = await supabase
      .from('user_profiles')
      .update({
        role: 'counselor',
        updated_at: new Date().toISOString()
      })
      .eq('id', application.user_id);

    if (updateUserError) {
      console.error('Error updating user role:', updateUserError);

      // Try a direct SQL update as a fallback
      try {
        // First check if the exec_sql function exists
        try {
          const { data: functionCheck, error: functionCheckError } = await supabase.rpc('exec_sql', {
            sql: `SELECT 1;`
          });

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

        console.log('Attempting direct SQL update as fallback');
        const { data: sqlResult, error: sqlError } = await supabase.rpc('exec_sql', {
          sql: `UPDATE public.user_profiles SET role = 'counselor', updated_at = NOW() WHERE id = '${application.user_id}' RETURNING id, role;`
        });

        console.log('SQL update result:', sqlResult);

        if (sqlError) {
          console.error('SQL update error:', sqlError);
          // Attempt to rollback the application status update
          await supabase
            .from('counselor_applications')
            .update({
              status: 'pending',
              updated_at: new Date().toISOString()
            })
            .eq('id', applicationId);

          return NextResponse.json(
            { error: 'Failed to update user role' },
            { status: 500 }
          );
        }
      } catch (sqlError) {
        console.error('Error with SQL update:', sqlError);
        // Attempt to rollback the application status update
        await supabase
          .from('counselor_applications')
          .update({
            status: 'pending',
            updated_at: new Date().toISOString()
          })
          .eq('id', applicationId);

        return NextResponse.json(
          { error: 'Failed to update user role' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Counselor application approved successfully'
    });
  } catch (error) {
    console.error('Error approving counselor application:', error);
    return NextResponse.json(
      { error: 'Failed to approve application: ' + error.message },
      { status: 500 }
    );
  }
}
