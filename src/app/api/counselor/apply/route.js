import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request) {
  try {
    // Get the request body
    const {
      credentials,
      yearsExperience,
      specializations,
      summary,
      phone = null,
      licenseUrl = null
    } = await request.json();

    // Validate required fields
    if (!credentials || !yearsExperience || !specializations || !summary) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Initialize Supabase client
    const supabase = createRouteHandlerClient({ cookies });

    // Try to get session from cookies first
    const { data: { session } } = await supabase.auth.getSession();

    // If no session from cookies, check for Authorization header
    let userId;
    if (session) {
      userId = session.user.id;
      console.log('User authenticated via cookies:', userId);
    } else {
      // Check for Authorization header
      const authHeader = request.headers.get('authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }

      // Extract the token
      const token = authHeader.split(' ')[1];

      // Verify the token
      const { data: userData, error: authError } = await supabase.auth.getUser(token);

      if (authError || !userData.user) {
        console.error('Auth error:', authError);
        return NextResponse.json(
          { error: 'Invalid authentication token' },
          { status: 401 }
        );
      }

      userId = userData.user.id;
      console.log('User authenticated via token:', userId);
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user already has a pending or approved application
    const { data: existingApplication, error: checkError } = await supabase
      .from('counselor_applications')
      .select('status')
      .eq('user_id', userId)
      .in('status', ['pending', 'approved'])
      .order('created_at', { ascending: false })
      .limit(1);

    if (checkError) {
      console.error('Error checking existing applications:', checkError);
    } else if (existingApplication && existingApplication.length > 0) {
      return NextResponse.json(
        { error: 'You already have a pending or approved application' },
        { status: 400 }
      );
    }

    // Insert the application into the database
    const { data: application, error: insertError } = await supabase
      .from('counselor_applications')
      .insert({
        user_id: userId,
        credentials,
        years_experience: parseInt(yearsExperience),
        specializations,
        summary,
        phone,
        license_url: licenseUrl,
        status: 'pending'
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating application:', insertError);
      return NextResponse.json(
        { error: 'Failed to submit application: ' + insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Application submitted successfully',
      applicationId: application.id
    });
  } catch (error) {
    console.error('Error submitting counselor application:', error);
    return NextResponse.json(
      { error: 'Failed to submit application: ' + error.message },
      { status: 500 }
    );
  }
}
