import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request) {
  try {
    // Initialize Supabase client with cookies
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Check for Authorization header
    const authHeader = request.headers.get('authorization');
    let session = null;

    console.log('Messages API called');

    // Try multiple auth methods to ensure we get a session

    // Method 1: Try using the Authorization header if present
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      console.log('Authorization header found, token:', token.substring(0, 10) + '...');

      try {
        // Set the auth token manually
        const { data, error } = await supabase.auth.setSession({
          access_token: token,
          refresh_token: '' // We don't have the refresh token from the header
        });

        if (error) {
          console.error('Error setting session from Authorization header:', error);
        } else if (data?.session) {
          session = data.session;
          console.log('Auth successful using Authorization header');
        }
      } catch (authError) {
        console.error('Exception setting session from Authorization header:', authError);
      }
    }

    // Method 2: If no session yet, try getting it from cookies
    if (!session) {
      try {
        console.log('Trying to get session from cookies');
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Error getting session from cookies:', error);
        } else if (data?.session) {
          session = data.session;
          console.log('Auth successful using cookies');
        }
      } catch (cookieError) {
        console.error('Exception getting session from cookies:', cookieError);
      }
    }

    // Method 3: If still no session, try refreshing
    if (!session) {
      try {
        console.log('Trying to refresh session');
        const { data, error } = await supabase.auth.refreshSession();

        if (error) {
          console.error('Error refreshing session:', error);
        } else if (data?.session) {
          session = data.session;
          console.log('Auth successful using session refresh');
        }
      } catch (refreshError) {
        console.error('Exception refreshing session:', refreshError);
      }
    }

    // If we still don't have a session, check cookies directly
    if (!session) {
      // Get all cookies
      const allCookies = cookieStore.getAll();
      console.log('All cookies:', allCookies.map(c => c.name));

      const accessTokenCookie = allCookies.find(c => c.name === 'sb-access-token');

      if (accessTokenCookie) {
        console.log('Found access token cookie:', accessTokenCookie.value.substring(0, 10) + '...');

        try {
          // Try to use the cookie value directly
          const { data, error } = await supabase.auth.setSession({
            access_token: accessTokenCookie.value,
            refresh_token: '' // We don't have the refresh token
          });

          if (error) {
            console.error('Error setting session from cookie:', error);
          } else if (data?.session) {
            session = data.session;
            console.log('Auth successful using cookie token');
          }
        } catch (cookieError) {
          console.error('Exception setting session from cookie:', cookieError);
        }
      } else {
        console.log('No access token cookie found');
      }
    }

    // If we still don't have a session, return an error
    if (!session) {
      console.log('Authentication failed - no valid session found after all attempts');
      return NextResponse.json({
        success: false,
        error: 'Authentication required',
        sessions: [],
        messages: [],
        messagesBySession: {},
        unreadCounts: {}
      });
    }

    // Use the user ID from the session
    const userId = session.user.id;

    // Log the user ID for debugging
    console.log('User ID from session:', userId);

    // First, get all sessions where the user is either a counselor or a patient
    const { data: userSessions, error: sessionsError } = await supabase
      .from('counseling_sessions')
      .select('id, counselor_id, patient_id, session_date, status')
      .or(`counselor_id.eq.${userId},patient_id.eq.${userId}`)
      .order('session_date', { ascending: false });

    if (sessionsError) {
      console.error('Error fetching sessions:', sessionsError);
      return NextResponse.json(
        { error: 'Failed to fetch sessions: ' + sessionsError.message },
        { status: 500 }
      );
    }

    if (!userSessions || userSessions.length === 0) {
      return NextResponse.json({
        success: true,
        sessions: [],
        messages: []
      });
    }

    // Get all session IDs
    const sessionIds = userSessions.map(session => session.id);

    // Get all messages for these sessions
    const { data: messages, error: messagesError } = await supabase
      .from('session_messages')
      .select(`
        *,
        session:session_id(id, counselor_id, patient_id, session_date, status)
      `)
      .in('session_id', sessionIds)
      .order('created_at', { ascending: false });

    if (messagesError) {
      console.error('Error fetching messages:', messagesError);
      return NextResponse.json(
        { error: 'Failed to fetch messages: ' + messagesError.message },
        { status: 500 }
      );
    }

    // Get all unique user IDs from the messages
    const userIds = new Set();
    messages.forEach(message => {
      userIds.add(message.sender_id);
      userIds.add(message.recipient_id);
    });
    userSessions.forEach(session => {
      userIds.add(session.counselor_id);
      userIds.add(session.patient_id);
    });

    // Fetch user profiles for all these users
    const { data: userProfiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('id, display_name, image_url')
      .in('id', Array.from(userIds));

    if (profilesError) {
      console.error('Error fetching user profiles:', profilesError);
      // Continue anyway, we'll just have less user info
    }

    // Create a map of user IDs to user profiles
    const userProfileMap = {};
    if (userProfiles) {
      userProfiles.forEach(profile => {
        userProfileMap[profile.id] = profile;
      });
    }

    // Enhance messages with user profile information
    const enhancedMessages = messages.map(message => {
      return {
        ...message,
        sender: userProfileMap[message.sender_id] || { id: message.sender_id, display_name: 'Unknown User' },
        recipient: userProfileMap[message.recipient_id] || { id: message.recipient_id, display_name: 'Unknown User' }
      };
    });

    // Enhance sessions with user profile information
    const enhancedSessions = userSessions.map(session => {
      return {
        ...session,
        counselor: userProfileMap[session.counselor_id] || { id: session.counselor_id, display_name: 'Unknown Counselor' },
        patient: userProfileMap[session.patient_id] || { id: session.patient_id, display_name: 'Unknown Patient' }
      };
    });

    // Group messages by session
    const messagesBySession = {};
    enhancedMessages.forEach(message => {
      if (!messagesBySession[message.session_id]) {
        messagesBySession[message.session_id] = [];
      }
      messagesBySession[message.session_id].push(message);
    });

    // Count unread messages
    const unreadCounts = {};
    enhancedMessages.forEach(message => {
      if (message.recipient_id === userId && !message.is_read) {
        if (!unreadCounts[message.session_id]) {
          unreadCounts[message.session_id] = 0;
        }
        unreadCounts[message.session_id]++;
      }
    });

    return NextResponse.json({
      success: true,
      sessions: enhancedSessions,
      messages: enhancedMessages,
      messagesBySession,
      unreadCounts
    });
  } catch (error) {
    console.error('Error in get-all messages API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages: ' + error.message },
      { status: 500 }
    );
  }
}
