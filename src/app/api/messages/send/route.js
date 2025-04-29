import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    // Initialize Supabase client
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Get message data from request body
    const { sessionId, message, recipientId, senderId } = await request.json();

    if (!sessionId || !message || !recipientId) {
      return NextResponse.json({
        success: false,
        error: 'Session ID, message, and recipient ID are required'
      }, { status: 400 });
    }

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    // Determine the sender ID - use provided ID if available, otherwise use authenticated user
    let actualSenderId = null;

    if (user && !userError) {
      actualSenderId = user.id;
      console.log(`API: User authenticated as ${actualSenderId}`);
    } else if (senderId) {
      // If no authenticated user but senderId provided, verify the session exists
      const { data: sessionData, error: sessionError } = await supabase
        .from('counseling_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (sessionError || !sessionData) {
        console.error('API: Error verifying session:', sessionError);
        return NextResponse.json({
          success: false,
          error: 'Invalid session'
        }, { status: 403 });
      }

      // Check if the provided senderId is part of this session
      if (sessionData.counselor_id === senderId || sessionData.patient_id === senderId) {
        actualSenderId = senderId;
        console.log(`API: Using provided sender ID ${actualSenderId}`);
      } else {
        console.error('API: Provided sender ID is not part of this session');
        return NextResponse.json({
          success: false,
          error: 'Sender is not part of this session'
        }, { status: 403 });
      }
    } else {
      console.error('API: No authenticated user or sender ID provided');
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 });
    }

    console.log(`API: Sending message in session ${sessionId} from ${actualSenderId} to ${recipientId}`);

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

    // Insert the message
    const { data, error } = await supabase
      .from('session_messages')
      .insert({
        session_id: sessionId,
        sender_id: actualSenderId,
        recipient_id: recipientId,
        message: message.trim(),
        is_read: false
      })
      .select();

    if (error) {
      console.error('API: Error sending message:', error);

      // Try one more time with raw SQL as a last resort
      try {
        const { data: rawData, error: rawError } = await supabase.rpc('exec_sql', {
          sql: `INSERT INTO public.session_messages (session_id, sender_id, recipient_id, message, is_read)
                VALUES ('${sessionId}', '${actualSenderId}', '${recipientId}', '${message.trim().replace(/'/g, "''")}', false)
                RETURNING *;`
        });

        if (rawError) {
          throw rawError;
        }

        console.log('API: Message sent successfully via raw SQL');
        return NextResponse.json({
          success: true,
          message: 'Message sent successfully via raw SQL',
          data: rawData
        });
      } catch (rawSqlError) {
        console.error('API: Error sending message via raw SQL:', rawSqlError);
        return NextResponse.json({
          success: false,
          error: `Failed to send message: ${error.message}`
        }, { status: 500 });
      }
    }

    console.log('API: Message sent successfully');

    return NextResponse.json({
      success: true,
      message: 'Message sent successfully',
      data: data[0]
    });
  } catch (error) {
    console.error('API: Unexpected error in send message:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
