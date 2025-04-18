import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request) {
  try {
    const { applicationId } = await request.json();

    if (!applicationId) {
      return NextResponse.json(
        { error: 'Application ID is required' },
        { status: 400 }
      );
    }

    const supabase = createRouteHandlerClient({ cookies });

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { data: currentUser, error: profileError } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (profileError || currentUser?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only administrators can approve counselor applications' },
        { status: 403 }
      );
    }

    const { data: application, error: applicationError } = await supabase
      .from('counselor_applications')
      .select('user_id, status')
      .eq('id', applicationId)
      .single();

    if (applicationError || !application) {
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

    const { error: updateAppError } = await supabase
      .from('counselor_applications')
      .update({
        status: 'approved',
        updated_at: new Date().toISOString()
      })
      .eq('id', applicationId);

    if (updateAppError) {
      return NextResponse.json(
        { error: 'Failed to update application status' },
        { status: 500 }
      );
    }

    const { data: targetUserProfile, error: profileCheckError } = await supabase
      .from('user_profiles')
      .select('id, role')
      .eq('id', application.user_id)
      .single();

    if (profileCheckError || !targetUserProfile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 500 }
      );
    }

    const { error: updateUserError } = await supabase
      .from('user_profiles')
      .update({
        role: 'counselor',
        updated_at: new Date().toISOString()
      })
      .eq('id', application.user_id);

    if (updateUserError) {
      try {
        const { error: sqlError } = await supabase.rpc('exec_sql', {
          sql: `
            UPDATE public.user_profiles
            SET role = 'counselor', updated_at = NOW()
            WHERE id = '${application.user_id}'
            RETURNING id, role;
          `
        });

        if (sqlError) {
          await supabase
            .from('counselor_applications')
            .update({
              status: 'pending',
              updated_at: new Date().toISOString()
            })
            .eq('id', applicationId);

          return NextResponse.json(
            { error: 'Direct SQL update failed' },
            { status: 500 }
          );
        }
      } catch (err) {
        await supabase
          .from('counselor_applications')
          .update({
            status: 'pending',
            updated_at: new Date().toISOString()
          })
          .eq('id', applicationId);

        return NextResponse.json(
          { error: 'Failed to update user role: ' + err.message },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Counselor application approved successfully'
    });

  } catch (error) {
    console.error('Unhandled error:', error);
    return NextResponse.json(
      { error: 'Internal error: ' + error.message },
      { status: 500 }
    );
  }
}
