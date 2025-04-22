import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request) {
  try {
    // Initialize Supabase client
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Get the current session
    const { data: { session } } = await supabase.auth.getSession();

    // Check if user is authenticated
    if (!session) {
      // For unread count, just return 0 if not authenticated
      // This is a non-critical feature
      return NextResponse.json({
        success: true,
        count: 0
      });
    }

    // Get the session ID from the query parameters (optional)
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    // Build the query
    let query = supabase
      .from('session_messages')
      .select('session_id', { count: 'exact' })
      .eq('recipient_id', session.user.id)
      .eq('is_read', false);

    // If a session ID is provided, filter by that session
    if (sessionId) {
      query = query.eq('session_id', sessionId);
    }

    // Execute the query
    const { count, error } = await query;

    if (error) {
      console.error('Error fetching unread count:', error);

      // Check if the table exists
      const { data: tableExists, error: tableCheckError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_name', 'session_messages')
        .eq('table_schema', 'public')
        .single();

      if (tableCheckError || !tableExists) {
        console.log('Messages table does not exist yet, trying to create it...');

        // Try to create the table
        try {
          const createResponse = await fetch('/api/db/create-messages-table', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            }
          });

          const createData = await createResponse.json();
          console.log('Table creation response:', createResponse.status, createData);

          if (!createResponse.ok) {
            console.error('Failed to create messages table:', createData.error || 'Unknown error');
            return NextResponse.json({
              success: true,
              count: 0,
              message: 'The messaging system is not set up yet.'
            });
          }

          console.log('Messages table created successfully');
          return NextResponse.json({
            success: true,
            count: 0,
            message: 'The messaging system has been set up.'
          });
        } catch (createError) {
          console.error('Error creating messages table:', createError);
          return NextResponse.json({
            success: true,
            count: 0,
            message: 'The messaging system is not set up yet.'
          });
        }
      }

      return NextResponse.json(
        { error: 'Failed to fetch unread count: ' + error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      count: count || 0
    });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    return NextResponse.json(
      { error: 'Failed to fetch unread count: ' + error.message },
      { status: 500 }
    );
  }
}
