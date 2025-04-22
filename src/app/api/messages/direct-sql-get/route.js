import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    // Initialize Supabase client
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Get session ID from query params
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json({
        success: false,
        error: 'Session ID is required'
      }, { status: 400 });
    }

    console.log('DIRECT SQL GET: Fetching messages for session', sessionId);

    // We no longer call fix-database on every fetch to avoid test message spam
    console.log('DIRECT SQL GET: Skipping database fix to avoid test message spam');

    // Use the Supabase client directly to fetch messages
    console.log('DIRECT SQL GET: Using Supabase client to fetch messages');
    const { data, error } = await supabase
      .from('session_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('DIRECT SQL GET: Error fetching messages:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch messages',
        details: error.message
      }, { status: 500 });
    }

    console.log('DIRECT SQL GET: Successfully fetched messages:', data ? data.length : 0);

    // Log each message for debugging
    if (data && data.length > 0) {
      data.forEach((msg, index) => {
        console.log(`DIRECT SQL GET: Message ${index + 1}:`, {
          id: msg.id,
          sender: msg.sender_id,
          recipient: msg.recipient_id,
          message: msg.message,
          created: msg.created_at
        });
      });
    } else {
      console.warn('DIRECT SQL GET: No messages found for this session');
    }

    return NextResponse.json({
      success: true,
      messages: data || [],
      sessionId,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('DIRECT SQL GET: Unexpected error:', error);
    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred',
      details: error.message
    }, { status: 500 });
  }
}
