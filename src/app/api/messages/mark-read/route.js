import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request) {
  try {
    // Get the request body
    const { sessionId, messageIds } = await request.json();

    // Validate required fields
    if (!sessionId && !messageIds) {
      return NextResponse.json(
        { error: 'Either sessionId or messageIds must be provided' },
        { status: 400 }
      );
    }

    // Initialize Supabase client
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Get the current user session
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      console.error('No session found in mark-read API');
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      });
    }

    const userId = session.user.id;

    let query = supabase
      .from('session_messages')
      .update({ is_read: true })
      .eq('recipient_id', userId)
      .eq('is_read', false);

    // If sessionId is provided, filter by session
    if (sessionId) {
      query = query.eq('session_id', sessionId);
    }

    // If messageIds is provided, filter by message IDs
    if (messageIds && messageIds.length > 0) {
      query = query.in('id', messageIds);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error marking messages as read:', error);
      return NextResponse.json(
        { error: 'Failed to mark messages as read: ' + error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Messages marked as read'
    });
  } catch (error) {
    console.error('Error in mark-read API:', error);
    return NextResponse.json(
      { error: 'Failed to mark messages as read: ' + error.message },
      { status: 500 }
    );
  }
}
