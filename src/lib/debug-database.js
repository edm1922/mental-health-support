import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Session ID to use for testing
const TEST_SESSION_ID = 'f19de89f-506a-4207-aa21-f09bda8d0dfb';
const PATIENT_ID = '4fd19577-3876-4087-b18b-51a7b194460a';
const COUNSELOR_ID = '1ccdfb9d-df48-4250-ba89-68c181b8c012';

export async function debugDatabase() {
  console.log('=== DATABASE DEBUGGING STARTED ===');
  console.log('Supabase URL:', supabaseUrl);
  
  try {
    // Step 1: Check if the session_messages table exists
    console.log('\n--- CHECKING SESSION_MESSAGES TABLE ---');
    const { data: tableExists, error: tableError } = await supabase
      .from('session_messages')
      .select('count(*)', { count: 'exact', head: true });
    
    if (tableError) {
      console.error('Error checking session_messages table:', tableError);
    } else {
      console.log('session_messages table exists, count:', tableExists);
    }
    
    // Step 2: Check if the user_profiles exist
    console.log('\n--- CHECKING USER PROFILES ---');
    const { data: users, error: usersError } = await supabase
      .from('user_profiles')
      .select('*')
      .in('id', [PATIENT_ID, COUNSELOR_ID]);
    
    if (usersError) {
      console.error('Error checking user profiles:', usersError);
    } else {
      console.log('User profiles found:', users?.length || 0);
      console.log('Users:', users);
    }
    
    // Step 3: Check if the counseling session exists
    console.log('\n--- CHECKING COUNSELING SESSION ---');
    const { data: session, error: sessionError } = await supabase
      .from('counseling_sessions')
      .select('*')
      .eq('id', TEST_SESSION_ID)
      .single();
    
    if (sessionError) {
      console.error('Error checking counseling session:', sessionError);
    } else {
      console.log('Counseling session found:', session);
    }
    
    // Step 4: Check for any messages in the session
    console.log('\n--- CHECKING EXISTING MESSAGES ---');
    const { data: messages, error: messagesError } = await supabase
      .from('session_messages')
      .select('*')
      .eq('session_id', TEST_SESSION_ID);
    
    if (messagesError) {
      console.error('Error checking messages:', messagesError);
    } else {
      console.log('Messages found:', messages?.length || 0);
      console.log('Messages:', messages);
    }
    
    // Step 5: Try to insert a test message
    console.log('\n--- INSERTING TEST MESSAGE ---');
    const { data: insertResult, error: insertError } = await supabase
      .from('session_messages')
      .insert({
        session_id: TEST_SESSION_ID,
        sender_id: PATIENT_ID,
        recipient_id: COUNSELOR_ID,
        message: `Test message from debug script at ${new Date().toISOString()}`
      })
      .select();
    
    if (insertError) {
      console.error('Error inserting test message:', insertError);
    } else {
      console.log('Test message inserted:', insertResult);
    }
    
    // Step 6: Check for messages again to verify the insert
    console.log('\n--- VERIFYING MESSAGE INSERT ---');
    const { data: verifyMessages, error: verifyError } = await supabase
      .from('session_messages')
      .select('*')
      .eq('session_id', TEST_SESSION_ID);
    
    if (verifyError) {
      console.error('Error verifying messages:', verifyError);
    } else {
      console.log('Messages after insert:', verifyMessages?.length || 0);
      console.log('Latest messages:', verifyMessages);
    }
    
    // Step 7: Check RLS status using SQL
    console.log('\n--- CHECKING RLS STATUS ---');
    const { data: rlsStatus, error: rlsError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT relname, relrowsecurity
        FROM pg_class
        WHERE relname = 'session_messages';
      `
    });
    
    if (rlsError) {
      console.error('Error checking RLS status:', rlsError);
    } else {
      console.log('RLS status:', rlsStatus);
    }
    
    // Step 8: Check foreign key constraints
    console.log('\n--- CHECKING FOREIGN KEY CONSTRAINTS ---');
    const { data: constraints, error: constraintsError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT
          tc.constraint_name,
          tc.table_name,
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name
        FROM
          information_schema.table_constraints AS tc
          JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
          JOIN information_schema.constraint_column_usage AS ccu
            ON ccu.constraint_name = tc.constraint_name
            AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name = 'session_messages';
      `
    });
    
    if (constraintsError) {
      console.error('Error checking constraints:', constraintsError);
    } else {
      console.log('Foreign key constraints:', constraints);
    }
    
    console.log('\n=== DATABASE DEBUGGING COMPLETED ===');
  } catch (error) {
    console.error('Unexpected error during database debugging:', error);
  }
}

// Run the debug function if this file is executed directly
if (typeof window === 'undefined' && process.env.NODE_ENV === 'development') {
  console.log('Running database debug script...');
  debugDatabase().catch(console.error);
}

export default debugDatabase;
