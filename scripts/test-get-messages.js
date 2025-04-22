// This script can be run directly with Node.js to test the direct-sql-get endpoint
// Run it with: node scripts/test-get-messages.js

// Set up environment variables from .env file
require('dotenv').config();

// Import necessary modules
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Session ID to use for testing
const TEST_SESSION_ID = 'f19de89f-506a-4207-aa21-f09bda8d0dfb';

async function testGetMessages() {
  console.log('=== TESTING GET MESSAGES ===');
  console.log('Supabase URL:', supabaseUrl);
  console.log('Session ID:', TEST_SESSION_ID);
  
  try {
    // Method 1: Use the Supabase client directly
    console.log('\n--- METHOD 1: SUPABASE CLIENT ---');
    const { data: messages, error } = await supabase
      .from('session_messages')
      .select('*')
      .eq('session_id', TEST_SESSION_ID)
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error('Error fetching messages with Supabase client:', error);
    } else {
      console.log(`Found ${messages.length} messages with Supabase client`);
      messages.forEach((msg, index) => {
        console.log(`Message ${index + 1}:`, {
          id: msg.id,
          sender: msg.sender_id,
          recipient: msg.recipient_id,
          message: msg.message,
          created: msg.created_at
        });
      });
    }
    
    // Method 2: Use SQL directly
    console.log('\n--- METHOD 2: DIRECT SQL ---');
    const { data: sqlMessages, error: sqlError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT * FROM public.session_messages 
        WHERE session_id = '${TEST_SESSION_ID}'::uuid 
        ORDER BY created_at ASC;
      `
    });
    
    if (sqlError) {
      console.error('Error fetching messages with SQL:', sqlError);
    } else {
      console.log(`Found ${sqlMessages.length} messages with SQL`);
      sqlMessages.forEach((msg, index) => {
        console.log(`Message ${index + 1}:`, {
          id: msg.id,
          sender: msg.sender_id,
          recipient: msg.recipient_id,
          message: msg.message,
          created: msg.created_at
        });
      });
    }
    
    console.log('\n=== TEST COMPLETED ===');
  } catch (error) {
    console.error('Unexpected error during test:', error);
  }
}

// Run the test function
console.log('Starting test...');
testGetMessages()
  .then(() => {
    console.log('Test completed.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error during test:', error);
    process.exit(1);
  });
