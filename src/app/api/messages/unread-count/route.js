import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request) {
  try {
    // Get query parameters
    const url = new URL(request.url);
    const sessionId = url.searchParams.get('sessionId');

    // Initialize Supabase client
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Get the current user session
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      console.error('No session found in unread-count API');
      return NextResponse.json({
        success: false,
        error: 'Authentication required',
        count: 0
      });
    }

    const userId = session.user.id;

    // Check if the session_messages table exists
    const { data: tableExists, error: tableCheckError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_name', 'session_messages')
      .eq('table_schema', 'public')
      .single();

    if (tableCheckError || !tableExists) {
      return NextResponse.json({
        success: true,
        count: 0,
        message: 'Messages table does not exist yet'
      });
    }

    let query = supabase
      .from('session_messages')
      .select('id', { count: 'exact' })
      .eq('recipient_id', userId)
      .eq('is_read', false);

    // If sessionId is provided, filter by session
    if (sessionId) {
      query = query.eq('session_id', sessionId);
    }

    const { count, error } = await query;

    if (error) {
      console.error('Error getting unread count:', error);
      return NextResponse.json(
        { error: 'Failed to get unread count: ' + error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      count: count || 0
    });
  } catch (error) {
    console.error('Error in unread-count API:', error);
    return NextResponse.json(
      { error: 'Failed to get unread count: ' + error.message },
      { status: 500 }
    );
  }
}
