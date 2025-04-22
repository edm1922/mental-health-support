import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Initialize Supabase client with cookies
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    console.log('Direct messages API called');
    
    // First check if the session is valid
    const { data: sessionValid, error: sessionError } = await supabase.rpc('is_session_valid');
    
    if (sessionError || !sessionValid) {
      console.error('Session validation error:', sessionError || 'Session invalid');
      return NextResponse.json({
        success: false,
        error: 'Authentication required',
        sessions: [],
        messages: [],
        messagesBySession: {},
        unreadCounts: {}
      });
    }
    
    console.log('Session is valid, fetching messages');
    
    // Get the user ID
    const { data: authData } = await supabase.rpc('get_authenticated_user');
    const userId = authData?.user?.id;
    
    if (!userId) {
      console.error('Could not determine user ID');
      return NextResponse.json({
        success: false,
        error: 'User ID not found',
        sessions: [],
        messages: [],
        messagesBySession: {},
        unreadCounts: {}
      });
    }
    
    console.log('User ID:', userId);
    
    // Get all sessions where the user is either a counselor or a patient
    const { data: userSessions, error: sessionsError } = await supabase
      .from('counseling_sessions')
      .select(`
        id,
        session_date,
        session_time,
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
        messages: [],
        messagesBySession: {},
        unreadCounts: {}
      });
    }
    
    // Get all messages for the user
    const { data: userMessages, error: messagesError } = await supabase.rpc('get_user_messages');
    
    if (messagesError) {
      console.error('Error fetching messages:', messagesError);
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch messages',
        sessions: userSessions || [],
        messages: [],
        messagesBySession: {},
        unreadCounts: {}
      });
    }
    
    // Get sender and recipient details for each message
    const messageIds = userMessages.map(msg => msg.sender_id).concat(
      userMessages.map(msg => msg.recipient_id)
    ).filter((id, index, self) => id !== userId && self.indexOf(id) === index);
    
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
    const messagesWithUsers = userMessages.map(msg => ({
      ...msg,
      sender: userMap[msg.sender_id] || { id: msg.sender_id, display_name: 'Unknown' },
      recipient: userMap[msg.recipient_id] || { id: msg.recipient_id, display_name: 'Unknown' }
    }));
    
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
      sessions: userSessions,
      messages: messagesWithUsers,
      messagesBySession,
      unreadCounts
    });
  } catch (error) {
    console.error('Error in direct messages API:', error);
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
