import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Initialize Supabase client with cookies
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    console.log('UUID messages API called');

    // First get the current user
    const { data: authData, error: authError } = await supabase.rpc('get_current_user');

    if (authError || !authData.authenticated) {
      console.error('Error getting current user:', authError || 'Not authenticated');
      return NextResponse.json({
        success: false,
        error: 'Authentication required',
        sessions: [],
        messages: [],
        messagesBySession: {},
        unreadCounts: {}
      });
    }

    const userId = authData.user.id;
    console.log('Current user ID (UUID):', userId);

    // Check if user has any messages
    const { data: hasMessages, error: hasMessagesError } = await supabase.rpc('user_has_messages', { user_uuid: userId });

    if (hasMessagesError) {
      console.error('Error checking if user has messages:', hasMessagesError);
    }

    // Check if user has any sessions
    const { data: hasSessions, error: hasSessionsError } = await supabase.rpc('user_has_sessions', { user_uuid: userId });

    if (hasSessionsError) {
      console.error('Error checking if user has sessions:', hasSessionsError);
    }

    console.log('User has messages:', hasMessages);
    console.log('User has sessions:', hasSessions);

    // Get messages for the user
    let userMessages = [];
    let messagesError = null;

    if (hasMessages) {
      const response = await supabase.rpc('get_messages_for_user', { user_uuid: userId });
      userMessages = response.data || [];
      messagesError = response.error;

      if (messagesError) {
        console.error('Error fetching messages:', messagesError);
      }
    } else {
      console.log('User has no messages, skipping fetch');
    }

    // Get all sessions where the user is either a counselor or a patient
    const { data: userSessions, error: sessionsError } = await supabase
      .from('counseling_sessions')
      .select(`
        id,
        session_date,
        status,
        notes,
        counselor_id,
        patient_id,
        counselor:counselor_id (id, display_name),
        patient:patient_id (id, display_name)
      `)
      .or(`counselor_id.eq.${userId},patient_id.eq.${userId}`)
      .order('session_date', { ascending: false });

    if (sessionsError) {
      console.error('Error fetching sessions:', sessionsError);
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch sessions',
        sessions: [],
        messages: userMessages || [],
        messagesBySession: {},
        unreadCounts: {}
      });
    }

    // Get sender and recipient details for each message
    const messageIds = userMessages ? userMessages.map(msg => msg.sender_id).concat(
      userMessages.map(msg => msg.recipient_id)
    ).filter((id, index, self) => id !== userId && self.indexOf(id) === index) : [];

    const { data: userProfiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('id, display_name')
      .in('id', messageIds);

    if (profilesError) {
      console.error('Error fetching user profiles:', profilesError);
    }

    // Create a map of user IDs to display names
    const userMap = {};
    if (userProfiles) {
      userProfiles.forEach(profile => {
        userMap[profile.id] = profile;
      });
    }

    // Add sender and recipient info to messages
    const messagesWithUsers = userMessages ? userMessages.map(msg => ({
      ...msg,
      sender: userMap[msg.sender_id] || { id: msg.sender_id, display_name: 'Unknown' },
      recipient: userMap[msg.recipient_id] || { id: msg.recipient_id, display_name: 'Unknown' }
    })) : [];

    // Group messages by session
    const messagesBySession = {};
    messagesWithUsers.forEach(msg => {
      if (!messagesBySession[msg.session_id]) {
        messagesBySession[msg.session_id] = [];
      }
      messagesBySession[msg.session_id].push(msg);
    });

    // Sort messages within each session by created_at (newest first)
    Object.keys(messagesBySession).forEach(sessionId => {
      messagesBySession[sessionId].sort((a, b) =>
        new Date(b.created_at) - new Date(a.created_at)
      );
    });

    // Count unread messages per session
    const unreadCounts = {};
    messagesWithUsers.forEach(msg => {
      if (msg.recipient_id === userId && !msg.is_read) {
        if (!unreadCounts[msg.session_id]) {
          unreadCounts[msg.session_id] = 0;
        }
        unreadCounts[msg.session_id]++;
      }
    });

    return NextResponse.json({
      success: true,
      sessions: userSessions || [],
      messages: messagesWithUsers,
      messagesBySession,
      unreadCounts
    });
  } catch (error) {
    console.error('Error in UUID messages API:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      sessions: [],
      messages: [],
      messagesBySession: {},
      unreadCounts: {}
    }, { status: 500 });
  }
}
