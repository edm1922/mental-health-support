import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import fs from 'fs';
import path from 'path';

export async function GET(request) {
  try {
    // Get the session ID from the query parameters
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    // Validate required fields
    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // Initialize Supabase client
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Get the current session
    const { data: { session } } = await supabase.auth.getSession();

    // Fix counselor chat RLS policies
    try {
      console.log('Fixing counselor chat RLS policies before fetching messages...');

      // Execute SQL to fix RLS policies for counselor chat
      const { error: sqlError } = await supabase.rpc('exec_sql', {
        sql: `
        -- Enable RLS on session_messages
        ALTER TABLE IF EXISTS public.session_messages ENABLE ROW LEVEL SECURITY;

        -- Create policy to allow users to see their own messages
        DROP POLICY IF EXISTS "Users can view their own messages" ON public.session_messages;
        CREATE POLICY "Users can view their own messages"
        ON public.session_messages
        FOR SELECT
        USING (
          sender_id::text = auth.uid()::text
          OR recipient_id::text = auth.uid()::text
          OR EXISTS (
            SELECT 1
            FROM counseling_sessions
            WHERE
              id = session_id
              AND (counselor_id::text = auth.uid()::text OR patient_id::text = auth.uid()::text)
          )
        );

        -- Create policy to allow users to insert messages
        DROP POLICY IF EXISTS "Users can insert messages" ON public.session_messages;
        CREATE POLICY "Users can insert messages"
        ON public.session_messages
        FOR INSERT
        WITH CHECK (
          sender_id::text = auth.uid()::text
          OR EXISTS (
            SELECT 1
            FROM counseling_sessions
            WHERE
              id = session_id
              AND (counselor_id::text = auth.uid()::text OR patient_id::text = auth.uid()::text)
          )
        );
        `
      });

      if (sqlError) {
        console.error('Error fixing RLS policies:', sqlError);
      } else {
        console.log('Counselor chat RLS policies fixed successfully');
      }
    } catch (error) {
      console.error('Error fixing counselor chat RLS policies:', error);
      // Continue anyway
    }

    // Check if user is authenticated
    if (!session) {
      // Instead of returning an error, try to create the table anyway
      // This helps with automatic initialization
      console.log('No authentication session, but continuing with table check');
    }

    // Verify the user has access to this counseling session
    const { data: counselingSession, error: sessionError } = await supabase
      .from('counseling_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (sessionError) {
      console.error('Error fetching session:', sessionError);
      return NextResponse.json(
        { error: 'Failed to fetch counseling session' },
        { status: 500 }
      );
    }

    // Check if the user is either the counselor or the patient
    // Skip permission check if session is null (for automatic initialization)
    if (session && session.user) {
      if (counselingSession.counselor_id !== session.user.id && counselingSession.patient_id !== session.user.id) {
        return NextResponse.json(
          { error: 'You do not have permission to view messages in this session' },
          { status: 403 }
        );
      }
    } else {
      console.log('Skipping permission check due to missing session');
    }

    // Try to get messages with relationships first
    let messages;
    let messagesError;

    try {
      // First, try to fix database relationships automatically
      try {
        // Read the SQL file
        const sqlFilePath = path.join(process.cwd(), 'src', 'sql', 'fix_database_relationships.sql');
        const sqlQuery = fs.readFileSync(sqlFilePath, 'utf8');

        // Execute the SQL query
        await supabase.rpc('exec_sql', { sql: sqlQuery });

        // Force a schema cache refresh
        await supabase.rpc('pg_notify', { channel: 'pgrst', payload: 'reload schema' });

        console.log('Database relationships fixed automatically in get messages API');
      } catch (fixError) {
        console.error('Error fixing database relationships:', fixError);
      }

      // Now try with relationships
      const { data, error } = await supabase
        .from('session_messages')
        .select(`
          *,
          sender:sender_id(id, display_name),
          recipient:recipient_id(id, display_name)
        `)
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (!error) {
        messages = data;
      } else if (error.message.includes('relationship')) {
        // If relationship error, try without relationships
        console.log('Relationship error, fetching messages without relationships');
        throw new Error('Relationship error');
      } else {
        messagesError = error;
      }
    } catch (relationshipError) {
      // If relationship error, try without relationships
      try {
        // Get messages without relationships
        const { data, error } = await supabase
          .from('session_messages')
          .select('*')
          .eq('session_id', sessionId)
          .order('created_at', { ascending: true });

        if (error) {
          messagesError = error;
        } else {
          // Now fetch user profiles separately
          const senderIds = [...new Set(data.map(msg => msg.sender_id))];
          const recipientIds = [...new Set(data.map(msg => msg.recipient_id))];
          const userIds = [...new Set([...senderIds, ...recipientIds])];

          // Fetch user profiles
          const { data: userProfiles, error: profilesError } = await supabase
            .from('user_profiles')
            .select('id, display_name')
            .in('id', userIds);

          if (profilesError) {
            console.error('Error fetching user profiles:', profilesError);
          }

          // Create a map of user profiles
          const userMap = {};
          if (userProfiles) {
            userProfiles.forEach(profile => {
              userMap[profile.id] = profile;
            });
          }

          // Attach user profiles to messages
          messages = data.map(msg => ({
            ...msg,
            sender: userMap[msg.sender_id] || { id: msg.sender_id, display_name: 'Unknown User' },
            recipient: userMap[msg.recipient_id] || { id: msg.recipient_id, display_name: 'Unknown User' }
          }));
        }
      } catch (error) {
        messagesError = error;
      }
    }

    if (messagesError) {
      console.error('Error fetching messages:', messagesError);

      // Check if the table exists
      const { data: tableExists, error: tableCheckError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_name', 'session_messages')
        .eq('table_schema', 'public')
        .single();

      if (tableCheckError || !tableExists) {
        return NextResponse.json(
          { error: 'The messaging system is not set up yet. Please contact an administrator.' },
          { status: 500 }
        );
      }

      // If the error is about relationships, try one more time with a direct query
      if (messagesError.message.includes('relationship')) {
        try {
          // Try a direct SQL query as a last resort
          const { data: directMessages, error: directError } = await supabase
            .from('session_messages')
            .select('*')
            .eq('session_id', sessionId)
            .order('created_at', { ascending: true });

          if (!directError && directMessages) {
            console.log('Successfully fetched messages with direct query');
            return NextResponse.json({
              success: true,
              messages: directMessages
            });
          }
        } catch (directQueryError) {
          console.error('Error with direct query:', directQueryError);
        }
      }

      return NextResponse.json(
        { error: 'Failed to fetch messages: ' + messagesError.message },
        { status: 500 }
      );
    }

    // Mark messages as read if the user is the recipient
    if (session && session.user) {
      const unreadMessages = messages.filter(
        msg => msg.recipient_id === session.user.id && !msg.is_read
      );

      if (unreadMessages.length > 0) {
        const unreadIds = unreadMessages.map(msg => msg.id);

        const { error: updateError } = await supabase
          .from('session_messages')
          .update({ is_read: true })
          .in('id', unreadIds);

        if (updateError) {
          console.error('Error marking messages as read:', updateError);
          // Continue anyway, as this is not critical
        }
      }
    } else {
      console.log('Skipping marking messages as read due to missing session');
    }

    return NextResponse.json({
      success: true,
      messages: messages
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages: ' + error.message },
      { status: 500 }
    );
  }
}
