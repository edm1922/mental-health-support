import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request) {
  try {
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

    const userId = session.user.id;

    console.log('Checking counselor status for user ID:', userId);

    // Check if the user is already a counselor
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, role')
      .eq('id', userId)
      .single();

    console.log('User profile:', userProfile, 'Error:', profileError);

    // Try a direct SQL query as well
    try {
      const { data: sqlResult, error: sqlError } = await supabase.rpc('exec_sql', {
        sql: `SELECT id, role FROM public.user_profiles WHERE id = '${userId}';`
      });

      console.log('SQL query result:', sqlResult, 'Error:', sqlError);

      if (sqlError) {
        // Try creating the function
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
    } catch (sqlQueryError) {
      console.error('Error with direct SQL query:', sqlQueryError);
    }

    if (!profileError && userProfile?.role === 'counselor') {
      console.log('User is a counselor');
      return NextResponse.json({ status: 'approved', isCounselor: true });
    }

    console.log('User is not a counselor, checking application status');

    // If the user profile has role 'counselor', we should update any pending applications to 'approved'
    if (userProfile?.role === 'counselor') {
      // Check if there are any pending applications that need to be updated
      const { data: pendingApplications, error: pendingError } = await supabase
        .from('counselor_applications')
        .select('id, status')
        .eq('user_id', userId)
        .eq('status', 'pending');

      if (!pendingError && pendingApplications?.length > 0) {
        console.log('Found pending applications for counselor:', pendingApplications);

        // Update all pending applications to approved
        const { error: updateError } = await supabase
          .from('counselor_applications')
          .update({
            status: 'approved',
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId)
          .eq('status', 'pending');

        if (updateError) {
          console.error('Error updating pending applications:', updateError);
        }
      }
    }

    // Check application status
    const { data: application, error: applicationError } = await supabase
      .from('counselor_applications')
      .select('status, created_at, updated_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (applicationError) {
      if (applicationError.code === 'PGRST116') {
        // No application found
        // If user is a counselor but has no application, create a dummy approved one
        if (userProfile?.role === 'counselor') {
          console.log('User is a counselor but has no application record, returning approved status');
          return NextResponse.json({
            status: 'approved',
            isCounselor: true,
            submittedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        }
        return NextResponse.json({ status: 'not_found' });
      }

      console.error('Error fetching application status:', applicationError);
      return NextResponse.json(
        { error: 'Failed to fetch application status' },
        { status: 500 }
      );
    }

    // If user is a counselor but application is not approved, override the status
    if (userProfile?.role === 'counselor' && application.status !== 'approved') {
      console.log('User is a counselor but application status is', application.status, 'returning approved status');
      return NextResponse.json({
        status: 'approved',
        isCounselor: true,
        submittedAt: application.created_at,
        updatedAt: new Date().toISOString()
      });
    }

    return NextResponse.json({
      status: application.status,
      submittedAt: application.created_at,
      updatedAt: application.updated_at,
      isCounselor: userProfile?.role === 'counselor'
    });
  } catch (error) {
    console.error('Error checking application status:', error);
    return NextResponse.json(
      { error: 'Failed to check application status: ' + error.message },
      { status: 500 }
    );
  }
}
