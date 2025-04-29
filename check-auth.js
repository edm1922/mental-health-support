// Simple script to check Supabase authentication
const { createClient } = require('@supabase/supabase-js');

// Use the same credentials as in the application
const supabaseUrl = 'https://euebogudyyeodzkvhyef.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV1ZWJvZ3VkeXllb2R6a3ZoeWVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4NjM5NDgsImV4cCI6MjA2MDQzOTk0OH0.b68JOxrpuFwWb2K3DraYvv32uqomvK0r1imbOCG0HKc';

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkAuth() {
  console.log('Checking Supabase authentication...');
  
  try {
    // Try to get the current session
    console.log('\n--- Checking current session ---');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Error getting session:', sessionError);
    } else if (!session) {
      console.log('No active session found');
    } else {
      console.log('Session found:', {
        id: session.id,
        expires_at: session.expires_at,
        user: {
          id: session.user.id,
          email: session.user.email,
          role: session.user.role
        }
      });
    }
    
    // Try to get user profiles
    console.log('\n--- Checking user_profiles table ---');
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(5);
    
    if (profilesError) {
      console.error('Error getting user profiles:', profilesError);
    } else {
      console.log(`Found ${profiles.length} user profiles`);
      if (profiles.length > 0) {
        console.log('First profile:', profiles[0]);
      }
    }
    
    // Try to get counseling sessions
    console.log('\n--- Checking counseling_sessions table ---');
    const { data: sessions, error: sessionsError } = await supabase
      .from('counseling_sessions')
      .select('*')
      .limit(5);
    
    if (sessionsError) {
      console.error('Error getting counseling sessions:', sessionsError);
    } else {
      console.log(`Found ${sessions.length} counseling sessions`);
      if (sessions.length > 0) {
        console.log('First session:', sessions[0]);
      }
    }
    
    // Try to get session messages
    console.log('\n--- Checking session_messages table ---');
    const { data: messages, error: messagesError } = await supabase
      .from('session_messages')
      .select('*')
      .limit(5);
    
    if (messagesError) {
      console.error('Error getting session messages:', messagesError);
    } else {
      console.log(`Found ${messages.length} session messages`);
      if (messages.length > 0) {
        console.log('First message:', messages[0]);
      }
    }
    
    // Check if RLS is enabled on session_messages
    console.log('\n--- Checking if we can disable RLS ---');
    const { data: disableRls, error: disableRlsError } = await supabase
      .rpc('disable_session_messages_rls');
    
    if (disableRlsError) {
      console.error('Error disabling RLS:', disableRlsError);
    } else {
      console.log('RLS disable result:', disableRls);
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the check
checkAuth();
