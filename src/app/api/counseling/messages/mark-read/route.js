import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request) {
  try {
    // Get the request body
    const { messageIds } = await request.json();

    // Validate required fields
    if (!messageIds || !Array.isArray(messageIds) || messageIds.length === 0) {
      return NextResponse.json(
        { error: 'Message IDs are required' },
        { status: 400 }
      );
    }

    // Initialize Supabase client
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Get the current session
    const { data: { session } } = await supabase.auth.getSession();

    // Check if user is authenticated
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Update the messages
    const { error: updateError } = await supabase
      .from('session_messages')
      .update({ is_read: true })
      .in('id', messageIds)
      .eq('recipient_id', session.user.id); // Only mark messages where the user is the recipient

    if (updateError) {
      console.error('Error marking messages as read:', updateError);
      return NextResponse.json(
        { error: 'Failed to mark messages as read: ' + updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Messages marked as read'
    });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    return NextResponse.json(
      { error: 'Failed to mark messages as read: ' + error.message },
      { status: 500 }
    );
  }
}
