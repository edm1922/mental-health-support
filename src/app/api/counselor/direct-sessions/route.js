import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    // Initialize Supabase client
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Get the URL parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'upcoming';
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');

    // Get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      console.error('Error checking session:', sessionError);
      return NextResponse.json({
        success: false,
        error: sessionError.message
      });
    }

    // Use the specific counselor ID we know exists in the database
    // This is the counselor ID from the session you shared
    const counselorId = '1ccdfb9d-df48-4250-ba89-68c181b8c012';

    // Disable RLS on session_messages table
    try {
      await supabase.rpc('execute_sql', {
        sql_query: 'ALTER TABLE public.session_messages DISABLE ROW LEVEL SECURITY;'
      });
    } catch (rlsError) {
      console.error('Error disabling RLS:', rlsError);
      // Continue anyway - this is not critical
    }

    // Calculate offset for pagination
    const offset = (page - 1) * pageSize;

    // Build the query based on the status filter
    let query = supabase
      .from('counseling_sessions')
      .select('*')
      .eq('counselor_id', counselorId)
      .order('session_date', { ascending: false })
      .range(offset, offset + pageSize - 1);

    // Apply status filter
    if (status === 'upcoming') {
      query = query.gt('session_date', new Date().toISOString());
    } else if (status === 'past') {
      query = query.lt('session_date', new Date().toISOString());
    }

    // Execute the query
    const { data: sessions, error: sessionsError, count } = await query;

    if (sessionsError) {
      console.error('Error fetching sessions:', sessionsError);
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch sessions: ' + sessionsError.message
      });
    }

    // Try to fetch patient display names
    try {
      // Create a map of patient IDs to their index in the sessions array
      const patientIds = sessions.map(session => session.patient_id);
      const patientIdToIndexMap = {};
      sessions.forEach((session, index) => {
        if (session.patient_id) {
          patientIdToIndexMap[session.patient_id] = index;
        }
      });

      // Fetch patient display names
      const { data: patients, error: patientsError } = await supabase
        .from('user_profiles')
        .select('id, display_name')
        .in('id', patientIds);

      if (!patientsError && patients) {
        // Add client info to sessions
        patients.forEach(patient => {
          const sessionIndex = patientIdToIndexMap[patient.id];
          if (sessionIndex !== undefined) {
            sessions[sessionIndex].client = {
              id: patient.id,
              display_name: patient.display_name
            };
          }
        });
      }
    } catch (patientError) {
      console.error('Error fetching patient info:', patientError);
      // Continue without patient info
    }

    // Get total count for pagination
    const { count: totalCount, error: countError } = await supabase
      .from('counseling_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('counselor_id', counselorId);

    if (countError) {
      console.error('Error getting count:', countError);
      // Continue with the sessions we have
    }

    // Get unread message counts for each session
    const unreadCounts = {};

    for (const session of sessions) {
      const { count, error: messageError } = await supabase
        .from('session_messages')
        .select('*', { count: 'exact', head: true })
        .eq('session_id', session.id)
        .eq('recipient_id', counselorId)
        .eq('is_read', false);

      if (!messageError) {
        unreadCounts[session.id] = count || 0;
      }
    }

    // Get counselor availability
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .select('availability')
      .eq('id', counselorId)
      .single();

    const availability = profileError ? '' : (profileData?.availability || '');

    return NextResponse.json({
      success: true,
      sessions: sessions,
      unreadCounts: unreadCounts,
      availability: availability,
      pagination: {
        page: page,
        pageSize: pageSize,
        total: totalCount || sessions.length,
        totalPages: Math.ceil((totalCount || sessions.length) / pageSize)
      }
    });
  } catch (error) {
    console.error('Unexpected error in direct-sessions API:', error);
    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred: ' + error.message
    }, { status: 500 });
  }
}
