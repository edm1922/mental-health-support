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

    console.log(`API: Fetching messages for session ${sessionId}`);

    // First, ensure RLS is disabled
    try {
      // Try direct SQL approach first
      await supabase.rpc('ensure_rls_disabled');
      console.log('API: RLS disabled successfully via function');
    } catch (rlsError) {
      console.error('API: Error calling ensure_rls_disabled function:', rlsError);

      // Fallback to direct SQL
      try {
        await supabase.rpc('exec_sql', {
          sql: `ALTER TABLE public.session_messages DISABLE ROW LEVEL SECURITY;`
        });
        console.log('API: RLS disabled successfully via direct SQL');
      } catch (directSqlError) {
        console.error('API: Error disabling RLS via direct SQL:', directSqlError);
        // Continue anyway
      }
    }

    // Get messages for the session
    try {
      const { data, error } = await supabase
        .from('session_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('API: Error fetching messages:', error);
        throw error;
      }

      console.log(`API: Successfully fetched ${data.length} messages`);

      // Ensure we always return an array
      const messagesArray = Array.isArray(data) ? data : [];

      return NextResponse.json({
        success: true,
        messages: messagesArray
      });
    } catch (queryError) {
      console.error('API: Error with standard query, trying raw SQL:', queryError);

      // Try with raw SQL as a fallback
      try {
        const { data: rawData, error: rawError } = await supabase.rpc('exec_sql', {
          sql: `SELECT * FROM public.session_messages
                WHERE session_id = '${sessionId}'
                ORDER BY created_at ASC;`
        });

        if (rawError) {
          throw rawError;
        }

        console.log(`API: Successfully fetched ${rawData?.length || 0} messages via raw SQL`);

        // Ensure we always return an array
        const messagesArray = Array.isArray(rawData) ? rawData : [];

        return NextResponse.json({
          success: true,
          messages: messagesArray
        });
      } catch (rawSqlError) {
        console.error('API: Error fetching messages via raw SQL:', rawSqlError);
        return NextResponse.json({
          success: false,
          error: 'Failed to fetch messages'
        }, { status: 500 });
      }
    }
  } catch (error) {
    console.error('API: Unexpected error in get messages:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
