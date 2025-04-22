import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    // Initialize Supabase client
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Get request body
    const { sessionId } = await request.json();

    if (!sessionId) {
      return NextResponse.json({
        success: false,
        error: 'Session ID is required'
      }, { status: 400 });
    }

    console.log('TEST INSERT: Starting test insert for session', sessionId);

    // First ensure RLS is disabled and test users exist
    try {
      await fetch(new URL('/api/auth/fix-rls', request.url));

      // Create test users
      const createUsersResponse = await fetch(new URL('/api/messages/create-test-users', request.url), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ sessionId })
      });

      if (!createUsersResponse.ok) {
        console.error('TEST INSERT: Error creating test users');
      }
    } catch (setupError) {
      console.error('TEST INSERT: Error in setup:', setupError);
      // Continue anyway
    }

    // Generate test data with actual user IDs
    const testMessage = {
      session_id: sessionId,
      sender_id: '4fd19577-3876-4087-b18b-51a7b194460a', // Patient ID
      recipient_id: '1ccdfb9d-df48-4250-ba89-68c181b8c012', // Counselor ID
      message: `Test message sent at ${new Date().toISOString()}`
    };

    // Use direct SQL to insert the message
    const insertSql = `
      INSERT INTO public.session_messages (
        session_id,
        sender_id,
        recipient_id,
        message,
        is_read,
        created_at,
        updated_at
      ) VALUES (
        '${testMessage.session_id}'::uuid,
        '${testMessage.sender_id}'::uuid,
        '${testMessage.recipient_id}'::uuid,
        '${testMessage.message.replace(/'/g, "''")}',
        false,
        now(),
        now()
      ) RETURNING *;
    `;

    const { data: insertResult, error: insertError } = await supabase.rpc('exec_sql', {
      sql: insertSql
    });

    if (insertError) {
      console.error('TEST INSERT: Error inserting test message:', insertError);
      return NextResponse.json({
        success: false,
        error: 'Error inserting test message',
        details: insertError.message
      }, { status: 500 });
    }

    console.log('TEST INSERT: Test message inserted successfully:', insertResult);

    // Fetch all messages for the session to verify
    const fetchSql = `
      SELECT * FROM public.session_messages
      WHERE session_id = '${sessionId}'::uuid
      ORDER BY created_at ASC;
    `;

    const { data: fetchResult, error: fetchError } = await supabase.rpc('exec_sql', {
      sql: fetchSql
    });

    if (fetchError) {
      console.error('TEST INSERT: Error fetching messages:', fetchError);
      return NextResponse.json({
        success: true,
        message: 'Test message inserted but error fetching messages',
        insertResult,
        fetchError: fetchError.message
      });
    }

    console.log('TEST INSERT: Fetched messages:', fetchResult);

    return NextResponse.json({
      success: true,
      message: 'Test message inserted successfully',
      insertResult,
      allMessages: fetchResult
    });
  } catch (error) {
    console.error('TEST INSERT: Unexpected error:', error);
    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred',
      details: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
