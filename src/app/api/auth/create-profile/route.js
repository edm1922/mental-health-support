import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Initialize Supabase client with cookies
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    console.log('Create profile API called');
    
    // Get the current user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      console.error('Error getting session:', sessionError || 'No session found');
      return NextResponse.json({
        success: false,
        error: 'Authentication required',
        message: 'You must be logged in to create a profile'
      });
    }
    
    const userId = session.user.id;
    console.log('Current user ID from session:', userId);
    
    // Check if user profile exists
    const { data: existingProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (profileError && profileError.code !== 'PGRST116') { // Not found is ok
      console.error('Error checking user profile:', profileError);
      return NextResponse.json({
        success: false,
        error: 'Failed to check user profile: ' + profileError.message
      });
    }
    
    if (existingProfile) {
      console.log('User profile already exists:', existingProfile);
      return NextResponse.json({
        success: true,
        message: 'User profile already exists',
        profile: existingProfile
      });
    }
    
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
        error: 'Failed to create user profile: ' + createError.message
      });
    }
    
    console.log('Created user profile:', newProfile);
    
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
        success: true,
        message: 'User profile created but failed to create test session',
        profile: newProfile,
        sessionError: createSessionError.message
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
        success: true,
        message: 'User profile and session created but failed to create test message',
        profile: newProfile,
        session: newSession,
        messageError: createMessageError.message
      });
    }
    
    console.log('Created test message:', newMessage);
    
    // Create RLS policies
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
    
    return NextResponse.json({
      success: true,
      message: 'User profile, session, and message created successfully',
      profile: newProfile,
      session: newSession,
      message: newMessage
    });
  } catch (error) {
    console.error('Error in create profile API:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
