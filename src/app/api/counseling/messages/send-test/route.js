import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request) {
  try {
    // Get the request body
    const {
      sessionId,
      recipientId,
      message,
      senderId = '11111111-1111-1111-1111-111111111111' // Default test sender ID
    } = await request.json();

    // Validate required fields
    if (!sessionId || !recipientId || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Initialize Supabase client
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Now insert the message without authentication check
    const { data: newMessage, error: insertError } = await supabase
      .from('session_messages')
      .insert({
        session_id: sessionId,
        sender_id: senderId,
        recipient_id: recipientId,
        message: message,
        is_read: false
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting message:', insertError);
      return NextResponse.json(
        { error: 'Failed to send message: ' + insertError.message },
        { status: 500 }
      );
    }

    // Create a response with the sender and recipient info
    const enhancedMessage = {
      ...newMessage,
      sender: {
        id: senderId,
        display_name: 'Test User'
      },
      recipient: {
        id: recipientId,
        display_name: 'Recipient'
      }
    };

    return NextResponse.json({
      success: true,
      message: enhancedMessage
    });
  } catch (error) {
    console.error('Error sending test message:', error);
    return NextResponse.json(
      { error: 'Failed to send test message: ' + error.message },
      { status: 500 }
    );
  }
}
