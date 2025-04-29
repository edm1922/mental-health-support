import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Initialize Supabase client with cookies
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    console.log('Get messages API called');
    
    // Get the current user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      console.error('Error getting session:', sessionError || 'No session found');
      return NextResponse.json({
        success: false,
        error: 'Authentication required',
        messages: []
      });
    }
    
    const userId = session.user.id;
    console.log('Current user ID from session:', userId);
    
    // Check if user profile exists
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (profileError && profileError.code !== 'PGRST116') { // Not found is ok
      console.error('Error checking user profile:', profileError);
      return NextResponse.json({
        success: false,
        error: 'Failed to check user profile: ' + profileError.message,
        messages: []
      });
    }
    
    if (!userProfile) {
      console.log('User profile not found, creating one...');
      // Create user profile
      const displayName = session.user.user_metadata?.name || 
                          session.user.email?.split('@')[0] || 
                          'User';
      
      const { data: newProfile, error: createError } = await supabase
        .from('user_profiles')
        .insert({
          id: userId,
          display_name: displayName,
          role: 'user',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (createError) {
        console.error('Error creating user profile:', createError);
        return NextResponse.json({
          success: false,
          error: 'Failed to create user profile: ' + createError.message,
          messages: []
        });
      }
      
      console.log('Created user profile:', newProfile);
    }
    
    // Get all sessions for the user
    const { data: sessions, error: sessionsError } = await supabase
      .from('counseling_sessions')
      .select('*')
      .or(`counselor_id.eq.${userId},patient_id.eq.${userId}`)
      .order('created_at', { ascending: false });
    
    if (sessionsError) {
      console.error('Error fetching sessions:', sessionsError);
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch sessions: ' + sessionsError.message,
        messages: []
      });
    }
    
    // If no sessions, create a test session
    if (!sessions || sessions.length === 0) {
      console.log('No sessions found, creating a test session...');
      
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
          messages: []
        });
      }
      
      console.log('Created test session:', newSession);
      
      // Create a test message
      const { data: newMessage, error: createMessageError } = await supabase
        .from('session_messages')
        .insert({
          session_id: newSession.id,
          sender_id: userId,
          recipient_id: userId,
          message: 'This is a test message created automatically',
          is_read: false
        })
        .select()
        .single();
      
      if (createMessageError) {
        console.error('Error creating test message:', createMessageError);
        return NextResponse.json({
          success: false,
          error: 'Failed to create test message: ' + createMessageError.message,
          messages: []
        });
      }
      
      console.log('Created test message:', newMessage);
      
      // Return the test message
      return NextResponse.json({
        success: true,
        messages: [newMessage]
      });
    }
    
    // Get all messages for the user
    const { data: messages, error: messagesError } = await supabase
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
        messages: []
      });
    }
    
    // If no messages, create a test message
    if (!messages || messages.length === 0) {
      console.log('No messages found, creating a test message...');
      
      const { data: newMessage, error: createMessageError } = await supabase
        .from('session_messages')
        .insert({
          session_id: sessions[0].id,
          sender_id: userId,
          recipient_id: userId,
          message: 'This is a test message created automatically',
          is_read: false
        })
        .select()
        .single();
      
      if (createMessageError) {
        console.error('Error creating test message:', createMessageError);
        return NextResponse.json({
          success: false,
          error: 'Failed to create test message: ' + createMessageError.message,
          messages: []
        });
      }
      
      console.log('Created test message:', newMessage);
      
      // Return the test message
      return NextResponse.json({
        success: true,
        messages: [newMessage]
      });
    }
    
    // Return all messages
    return NextResponse.json({
      success: true,
      messages: messages
    });
  } catch (error) {
    console.error('Error in get messages API:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      messages: []
    }, { status: 500 });
  }
}
