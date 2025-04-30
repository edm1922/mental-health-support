import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Initialize Supabase client with cookies
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    console.log('Direct query messages API called');

    // Get the current user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      console.error('Error getting session:', sessionError || 'No session found');
      return NextResponse.json({
        success: false,
        error: 'Authentication required',
        sessions: [],
        messages: [],
        messagesBySession: {},
        unreadCounts: {}
      });
    }

    const userId = session.user.id;
    console.log('Current user ID from session:', userId);

    // First, ensure we have the necessary tables and permissions
    await supabase.rpc('exec_sql', {
      sql: `
      -- Enable RLS on session_messages
      ALTER TABLE IF EXISTS public.session_messages ENABLE ROW LEVEL SECURITY;

      -- Create policy to allow users to see their own messages
      DROP POLICY IF EXISTS "Users can view their own messages" ON public.session_messages;
      CREATE POLICY "Users can view their own messages"
      ON public.session_messages
      FOR SELECT
      USING (sender_id::text = auth.uid()::text OR recipient_id::text = auth.uid()::text);

      -- Create policy to allow users to insert messages
      DROP POLICY IF EXISTS "Users can insert messages" ON public.session_messages;
      CREATE POLICY "Users can insert messages"
      ON public.session_messages
      FOR INSERT
      WITH CHECK (sender_id::text = auth.uid()::text);
      `
    });

    // Get all sessions where the user is either a counselor or a patient
    let { data: userSessions, error: sessionsError } = await supabase
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
        error: 'Failed to fetch sessions: ' + sessionsError.message,
        sessions: [],
        messages: [],
        messagesBySession: {},
        unreadCounts: {}
      });
    }

    console.log('Sessions found:', userSessions?.length || 0);

    // If no sessions, create a test session and message
    if (!userSessions || userSessions.length === 0) {
      console.log('No sessions found, creating a test session and message');

      // Get user profile
      const { data: userProfile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.error('Error fetching user profile:', profileError);

        // Create a user profile if it doesn't exist
        const { data: newProfile, error: createProfileError } = await supabase
          .from('user_profiles')
          .insert({
            id: userId,
            display_name: session.user.email?.split('@')[0] || 'User',
            role: 'user',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (createProfileError) {
          console.error('Error creating user profile:', createProfileError);
        } else {
          console.log('Created user profile:', newProfile);
        }
      }

      // Create a test session
      const { data: newSession, error: createSessionError } = await supabase
        .from('counseling_sessions')
        .insert({
          counselor_id: userId,
          patient_id: userId, // Self-session for testing
          session_date: new Date().toISOString(),
          status: 'test',
          notes: 'This is a test session created automatically'
        })
        .select()
        .single();

      if (createSessionError) {
        console.error('Error creating test session:', createSessionError);
        return NextResponse.json({
          success: false,
          error: 'Failed to create test session: ' + createSessionError.message,
          sessions: [],
          messages: [],
          messagesBySession: {},
          unreadCounts: {}
        });
      }

      console.log('Created test session:', newSession);

      // Create a test message
      const { error: createMessageError } = await supabase
        .from('session_messages')
        .insert({
          session_id: newSession.id,
          sender_id: userId,
          recipient_id: userId,
          message: 'This is a test message created automatically',
          is_read: false
        });

      if (createMessageError) {
        console.error('Error creating test message:', createMessageError);
      } else {
        console.log('Created test message');
      }

      // Add the new session to the sessions array
      userSessions = [
        {
          ...newSession,
          counselor: { id: userId, display_name: userProfile?.display_name || 'You' },
          patient: { id: userId, display_name: userProfile?.display_name || 'You' }
        }
      ];
    }

    // Get all messages for the user directly
    const { data: userMessages, error: messagesError } = await supabase
      .from('session_messages')
      .select(`
        id,
        session_id,
        sender_id,
        recipient_id,
        message,
        is_read,
        created_at
      `)
      .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (messagesError) {
      console.error('Error fetching messages:', messagesError);
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch messages: ' + messagesError.message,
        sessions: userSessions || [],
        messages: [],
        messagesBySession: {},
        unreadCounts: {}
      });
    }

    console.log('Messages found:', userMessages?.length || 0);

    // Get user profiles for all users involved in messages
    const userIds = new Set();
    if (userMessages) {
      userMessages.forEach(msg => {
        if (msg.sender_id !== userId) userIds.add(msg.sender_id);
        if (msg.recipient_id !== userId) userIds.add(msg.recipient_id);
      });
    }

    const { data: userProfiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('id, display_name')
      .in('id', Array.from(userIds));

    if (profilesError) {
      console.error('Error fetching user profiles:', profilesError);
    }

    // Create a map of user IDs to profiles
    const userMap = {};
    if (userProfiles) {
      userProfiles.forEach(profile => {
        userMap[profile.id] = profile;
      });
    }

    // Add the current user to the map
    userMap[userId] = { id: userId, display_name: 'You' };

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
    console.error('Error in direct query messages API:', error);
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
