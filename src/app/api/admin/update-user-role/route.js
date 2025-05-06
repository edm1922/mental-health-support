import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    // Get the request body
    const { userId, role } = await request.json();

    if (!userId || !role) {
      return NextResponse.json({
        success: false,
        error: 'User ID and role are required'
      }, { status: 400 });
    }

    // Validate role
    const validRoles = ['user', 'counselor', 'admin'];
    if (!validRoles.includes(role)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid role. Must be one of: user, counselor, admin'
      }, { status: 400 });
    }

    // Initialize Supabase client
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 });
    }

    // Try multiple approaches to update the user's role
    console.log(`Attempting to update user ${userId} role to ${role}`);

    // First, update the user's metadata to include the role
    try {
      const { error: metadataError } = await supabase.auth.admin.updateUserById(
        userId,
        {
          user_metadata: { role: role }
        }
      );

      if (metadataError) {
        console.error('Error updating user metadata:', metadataError);
        // Continue anyway, we'll try to update the profile
      } else {
        console.log('User metadata updated successfully');
      }
    } catch (metadataError) {
      console.error('Exception updating user metadata:', metadataError);
      // Continue anyway, we'll try to update the profile
    }

    // Approach 1: Direct update
    const { data: updateResult, error: updateError } = await supabase
      .from('user_profiles')
      .update({
        role: role,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select();

    console.log('Direct update result:', updateResult, 'Error:', updateError);

    if (updateError) {
      // Approach 2: Try with SQL
      try {
        const { data: sqlResult, error: sqlError } = await supabase.rpc('exec_sql', {
          sql: `UPDATE public.user_profiles SET role = '${role}', updated_at = NOW() WHERE id = '${userId}' RETURNING id, role;`
        });

        console.log('SQL update result:', sqlResult, 'Error:', sqlError);

        if (sqlError) {
          // Approach 3: Try upsert
          const { data: upsertResult, error: upsertError } = await supabase
            .from('user_profiles')
            .upsert({
              id: userId,
              role: role,
              updated_at: new Date().toISOString()
            })
            .select();

          console.log('Upsert result:', upsertResult, 'Error:', upsertError);

          if (upsertError) {
            console.error('All update approaches failed:', updateError, sqlError, upsertError);
            return NextResponse.json({
              success: false,
              error: 'Failed to update user role after trying multiple approaches'
            }, { status: 500 });
          }
        }
      } catch (sqlExecError) {
        console.error('Error executing SQL:', sqlExecError);
      }
    }

    // Double-check that the update worked
    const { data: checkProfile, error: checkError } = await supabase
      .from('user_profiles')
      .select('id, role')
      .eq('id', userId)
      .single();

    console.log('Profile after update:', checkProfile, 'Error:', checkError);

    if (checkError || (checkProfile && checkProfile.role !== role)) {
      console.error('Update verification failed:', checkError || 'Role mismatch');
      return NextResponse.json({
        success: false,
        error: 'Failed to verify role update'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `User role updated to ${role} successfully`
    });
  } catch (error) {
    console.error('Unexpected error in update-user-role API:', error);
    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred'
    }, { status: 500 });
  }
}
