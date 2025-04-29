// Simple script to check Supabase database structure and authentication
const { createClient } = require('@supabase/supabase-js');

// Use the same credentials as in the application
const supabaseUrl = 'https://euebogudyyeodzkvhyef.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV1ZWJvZ3VkeXllb2R6a3ZoeWVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4NjM5NDgsImV4cCI6MjA2MDQzOTk0OH0.b68JOxrpuFwWb2K3DraYvv32uqomvK0r1imbOCG0HKc';

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkSupabase() {
  console.log('Checking Supabase database structure...');

  try {
    // Check if the user_profiles table exists and its structure
    console.log('\n--- Checking user_profiles table ---');
    const { data: userProfilesInfo, error: userProfilesError } = await supabase
      .rpc('get_table_structure', { table_name: 'user_profiles' });

    if (userProfilesError) {
      console.error('Error checking user_profiles table:', userProfilesError);
    } else {
      console.log('user_profiles columns:', userProfilesInfo);
    }

    // Check if the counseling_sessions table exists and its structure
    console.log('\n--- Checking counseling_sessions table ---');
    const { data: sessionsInfo, error: sessionsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'counseling_sessions')
      .eq('table_schema', 'public');

    if (sessionsError) {
      console.error('Error checking counseling_sessions table:', sessionsError);
    } else {
      console.log('counseling_sessions columns:', sessionsInfo);
    }

    // Check if the session_messages table exists and its structure
    console.log('\n--- Checking session_messages table ---');
    const { data: messagesInfo, error: messagesError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'session_messages')
      .eq('table_schema', 'public');

    if (messagesError) {
      console.error('Error checking session_messages table:', messagesError);
    } else {
      console.log('session_messages columns:', messagesInfo);
    }

    // Check RLS status for session_messages
    console.log('\n--- Checking RLS status for session_messages ---');
    const { data: rlsStatus, error: rlsError } = await supabase
      .from('information_schema.tables')
      .select('row_level_security')
      .eq('table_name', 'session_messages')
      .eq('table_schema', 'public')
      .single();

    if (rlsError) {
      console.error('Error checking RLS status:', rlsError);
    } else {
      console.log('RLS status for session_messages:', rlsStatus);
    }

    // Check if the auth.uid() function is working
    console.log('\n--- Checking auth.uid() function ---');
    const { data: authUidResult, error: authUidError } = await supabase.rpc('get_auth_uid');

    if (authUidError) {
      console.error('Error checking auth.uid():', authUidError);
      console.log('Note: This is expected to fail if not authenticated');
    } else {
      console.log('auth.uid() result:', authUidResult);
    }

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

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the check
checkSupabase();
