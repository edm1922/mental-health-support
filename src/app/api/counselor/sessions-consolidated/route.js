import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';
export const revalidate = 0; // Disable caching completely

export async function GET(request) {
  try {
    // Initialize Supabase client
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Get the current session
    console.log('Fetching session from cookies...');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    // Log cookie information for debugging
    console.log('Cookie store available:', !!cookieStore);

    if (sessionError) {
      console.error('Session error:', sessionError);
      return NextResponse.json({
        success: false,
        error: 'Authentication error: ' + sessionError.message
      }, { status: 401 });
    }

    if (!session) {
      console.error('No session found');
      return NextResponse.json({
        success: false,
        error: 'Authentication required - no active session'
      }, { status: 401 });
    }

    // Use the existing session instead of refreshing
    // This avoids potential issues with session refresh
    console.log('Using existing session without refresh');
    const user = session.user;

    if (!user) {
      console.error('No user found in refreshed session');
      return NextResponse.json({
        success: false,
        error: 'Authentication required - no user found'
      }, { status: 401 });
    }

    // Skip trying to disable RLS as it might be causing issues
    console.log('Skipping RLS disable attempt to avoid potential issues');

    const userId = user.id;

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get('status') || 'upcoming'; // 'upcoming', 'past', 'all'
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');

    // Calculate pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    // First, check if the user is a counselor
    console.log('Checking if user is a counselor, userId:', userId);

    try {
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('role, availability_hours')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);

        // Try a more direct query to debug
        const { data: directProfile, error: directError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', userId);

        console.log('Direct profile query result:', directProfile, 'Error:', directError);

        return NextResponse.json({
          success: false,
          error: 'Failed to fetch user profile: ' + profileError.message,
          details: { userId }
        }, { status: 500 });
      }

      console.log('User profile found:', profile);

      if (!profile || profile.role !== 'counselor') {
        return NextResponse.json({
          success: false,
          error: 'Only counselors can access this data. Current role: ' + (profile?.role || 'unknown'),
          details: { userId, role: profile?.role }
        }, { status: 403 });
      }
    } catch (profileCheckError) {
      console.error('Unexpected error checking profile:', profileCheckError);
      return NextResponse.json({
        success: false,
        error: 'Error checking counselor status: ' + profileCheckError.message
      }, { status: 500 });
    }

    // Build the query for sessions
    let query = supabase
      .from('counseling_sessions')
      .select(`
        *,
        client:patient_id(id, display_name)
      `, { count: 'exact' })
      .eq('counselor_id', userId);

    // Add status filter
    const now = new Date().toISOString();

    if (statusFilter === 'upcoming') {
      query = query.gte('session_date', now).order('session_date', { ascending: true });
    } else if (statusFilter === 'past') {
      query = query.lt('session_date', now).order('session_date', { ascending: false });
    } else {
      query = query.order('session_date', { ascending: false });
    }

    // Add pagination
    query = query.range(from, to);

    // Execute the query
    const { data: sessions, count, error: sessionsError } = await query;

    if (sessionsError) {
      // If the error is related to the relationship, try without it
      if (sessionsError.message.includes('relationship') || sessionsError.message.includes('schema cache')) {
        console.log('Relationship error, trying without relationship query');

        // Try without the relationship query
        const { data: basicSessionData, count: basicCount, error: basicError } = await supabase
          .from('counseling_sessions')
          .select('*', { count: 'exact' })
          .eq('counselor_id', userId)
          .range(from, to);

        if (basicError) {
          console.error('Error fetching sessions with basic query:', basicError);
          return NextResponse.json({
            success: false,
            error: 'Failed to fetch sessions'
          }, { status: 500 });
        }

        // If we have sessions, fetch the client details separately
        if (basicSessionData && basicSessionData.length > 0) {
          // Get unique patient/client IDs
          const patientIds = basicSessionData
            .map(session => session.patient_id)
            .filter(id => id); // Filter out null/undefined

          // Fetch user profiles for these IDs
          const { data: clientProfiles, error: clientError } = await supabase
            .from('user_profiles')
            .select('id, display_name')
            .in('id', patientIds);

          if (clientError) {
            console.error('Error fetching client profiles:', clientError);
          }

          // Create a map of client profiles
          const clientMap = {};
          if (clientProfiles) {
            clientProfiles.forEach(profile => {
              clientMap[profile.id] = profile;
            });
          }

          // Attach client profiles to sessions
          const sessionsWithClients = basicSessionData.map(session => ({
            ...session,
            client: clientMap[session.patient_id] || { display_name: 'Unknown Client' }
          }));

          // Now fetch unread message counts for all sessions in one batch
          const sessionIds = basicSessionData.map(session => session.id);
          const unreadCounts = await getUnreadMessageCounts(supabase, userId, sessionIds);

          return NextResponse.json({
            success: true,
            sessions: sessionsWithClients,
            unreadCounts,
            availability: profile.availability_hours || '',
            pagination: {
              page,
              pageSize,
              total: basicCount || 0,
              totalPages: Math.ceil((basicCount || 0) / pageSize)
            }
          });
        }

        return NextResponse.json({
          success: true,
          sessions: [],
          unreadCounts: {},
          availability: profile.availability_hours || '',
          pagination: {
            page,
            pageSize,
            total: 0,
            totalPages: 0
          }
        });
      }

      console.error('Error fetching sessions:', sessionsError);
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch sessions'
      }, { status: 500 });
    }

    // Fetch unread message counts for all sessions in one batch
    const sessionIds = sessions.map(session => session.id);
    const unreadCounts = await getUnreadMessageCounts(supabase, userId, sessionIds);

    return NextResponse.json({
      success: true,
      sessions: sessions || [],
      unreadCounts,
      availability: profile.availability_hours || '',
      pagination: {
        page,
        pageSize,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize)
      }
    });
  } catch (error) {
    console.error('Unexpected error in sessions-consolidated API:', error);
    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred'
    }, { status: 500 });
  }
}

// Helper function to get unread message counts for multiple sessions in one query
async function getUnreadMessageCounts(supabase, userId, sessionIds) {
  if (!sessionIds || sessionIds.length === 0) {
    return {};
  }

  try {
    // Check if the session_messages table exists
    const { data: tableExists, error: tableCheckError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_name', 'session_messages')
      .eq('table_schema', 'public')
      .single();

    if (tableCheckError || !tableExists) {
      console.log('Messages table does not exist yet');
      return {};
    }

    // Get unread counts for all sessions in one query
    const { data, error } = await supabase.rpc('count_unread_messages', {
      user_id: userId,
      session_ids: sessionIds
    });

    if (error) {
      console.error('Error fetching unread counts with RPC:', error);

      // Fallback to direct query if RPC fails
      try {
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('session_messages')
          .select('session_id')
          .eq('recipient_id', userId)
          .eq('is_read', false)
          .in('session_id', sessionIds);

        if (fallbackError) {
          console.error('Fallback query also failed:', fallbackError);
          return {};
        }

        // Count messages manually
        const counts = {};
        if (fallbackData && fallbackData.length > 0) {
          fallbackData.forEach(msg => {
            counts[msg.session_id] = (counts[msg.session_id] || 0) + 1;
          });
        }
        return counts;
      } catch (fallbackErr) {
        console.error('Error in fallback query:', fallbackErr);
        return {};
      }
    }

    // Convert the result to a map of session_id -> count
    const counts = {};
    if (data && data.length > 0) {
      data.forEach(item => {
        counts[item.session_id] = parseInt(item.count);
      });
    }

    return counts;
  } catch (err) {
    console.error('Error in getUnreadMessageCounts:', err);
    return {};
  }
}
