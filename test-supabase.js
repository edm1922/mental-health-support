// Simple script to test Supabase connection
const { createClient } = require('@supabase/supabase-js');

// Hardcode the values for testing
const supabaseUrl = 'https://euebogudyyeodzkvhyef.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV1ZWJvZ3VkeXllb2R6a3ZoeWVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4NjM5NDgsImV4cCI6MjA2MDQzOTk0OH0.b68JOxrpuFwWb2K3DraYvv32uqomvK0r1imbOCG0HKc';

console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Anon Key:', supabaseAnonKey.substring(0, 10) + '...');

// Create a supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  try {
    console.log('Testing Supabase connection...');

    // Try the auth API first
    console.log('Testing auth API...');
    const { data: authData, error: authError } = await supabase.auth.getSession();

    if (authError) {
      console.error('Auth API error:', authError);
    } else {
      console.log('Auth API working!');
    }

    // Try a simple query to user_profiles
    console.log('\nTesting query to user_profiles...');
    const { data, error } = await supabase.from('user_profiles').select('id').limit(1);

    if (error) {
      console.error('Query error:', error);
    } else {
      console.log('Query successful!');
      console.log('Data:', data);
    }

    // Check for tables we know exist
    const knownTables = [
      'user_profiles',
      'counselor_applications',
      'mental_health_checkins',
      'counseling_sessions',
      'discussion_posts',
      'discussion_comments',
      'educational_contents',
      'inspirational_quotes'
    ];

    console.log('\nChecking for known tables:');
    for (const tableName of knownTables) {
      try {
        const { error } = await supabase.from(tableName).select('*').limit(1);
        console.log(`- ${tableName}: ${!error ? 'EXISTS' : 'ERROR - ' + error.message}`);
      } catch (e) {
        console.error(`- ${tableName}: EXCEPTION - ${e.message}`);
      }
    }

    // Try to get the version
    console.log('\nTesting version RPC...');
    const { data: versionData, error: versionError } = await supabase.rpc('version');

    if (versionError) {
      console.error('Error getting version:', versionError);
    } else {
      console.log('Supabase version:', versionData);
    }
  } catch (error) {
    console.error('Exception during test:', error);
  }
}

testConnection();
