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
    const { sessionId, message, senderId, recipientId } = await request.json();

    if (!sessionId || !message || !senderId || !recipientId) {
      return NextResponse.json({
        success: false,
        error: 'Session ID, message, sender ID, and recipient ID are all required'
      }, { status: 400 });
    }

    console.log('DIRECT SQL INSERT: Starting with parameters:');
    console.log('Session ID:', sessionId);
    console.log('Sender ID:', senderId);
    console.log('Recipient ID:', recipientId);
    console.log('Message:', message);

    // We no longer call fix-database on every message send to avoid test message spam
    console.log('DIRECT SQL INSERT: Skipping database fix to avoid test message spam');

    // Use the Supabase client directly to insert the message
    console.log('DIRECT SQL INSERT: Using Supabase client to insert message');
    console.log('DIRECT SQL INSERT: Session ID:', sessionId);
    console.log('DIRECT SQL INSERT: Sender ID:', senderId);
    console.log('DIRECT SQL INSERT: Recipient ID:', recipientId);
    console.log('DIRECT SQL INSERT: Message:', message.trim());

    const { data: insertData, error: insertError } = await supabase
      .from('session_messages')
      .insert({
        session_id: sessionId,
        sender_id: senderId,
        recipient_id: recipientId,
        message: message.trim(),
        is_read: false
      })
      .select();

    if (insertError) {
      console.error('DIRECT SQL INSERT: Error inserting message:', insertError);

      // Try a different approach with a PL/pgSQL block for better error handling
      const plpgsqlSql = `
        DO $$
        DECLARE
          new_id uuid := gen_random_uuid();
        BEGIN
          INSERT INTO public.session_messages
            (id, session_id, sender_id, recipient_id, message, is_read, created_at, updated_at)
          VALUES
            (new_id,
             '${sessionId}'::uuid,
             '${senderId}'::uuid,
             '${recipientId}'::uuid,
             '${message.trim().replace(/'/g, "''")}',
             false,
             NOW(),
             NOW());

          RAISE NOTICE 'Message inserted with ID: %', new_id;
        EXCEPTION WHEN OTHERS THEN
          RAISE NOTICE 'Error inserting message: %', SQLERRM;
          RAISE;
        END $$;

        SELECT * FROM public.session_messages ORDER BY created_at DESC LIMIT 1;
      `;

      console.log('DIRECT SQL INSERT: Trying PL/pgSQL approach');

      const { data: plpgsqlData, error: plpgsqlError } = await supabase.rpc('exec_sql', {
        sql: plpgsqlSql
      });

      if (plpgsqlError) {
        console.error('DIRECT SQL INSERT: PL/pgSQL approach failed:', plpgsqlError);

        // One last attempt with a simpler query
        const simpleSql = `
          INSERT INTO session_messages (session_id, sender_id, recipient_id, message)
          VALUES ('${sessionId}', '${senderId}', '${recipientId}', '${message.trim().replace(/'/g, "''")}')
          RETURNING *;
        `;

        console.log('DIRECT SQL INSERT: Trying simple SQL approach');

        const { data: simpleData, error: simpleError } = await supabase.rpc('exec_sql', {
          sql: simpleSql
        });

        if (simpleError) {
          console.error('DIRECT SQL INSERT: Simple SQL approach failed:', simpleError);

          // Try one last approach using the Supabase client directly
          console.log('DIRECT SQL INSERT: Trying Supabase client approach');

          try {
            const { data: directData, error: directError } = await supabase
              .from('session_messages')
              .insert({
                session_id: sessionId,
                sender_id: senderId,
                recipient_id: recipientId,
                message: message.trim()
              })
              .select();

            if (directError) {
              console.error('DIRECT SQL INSERT: Supabase client approach failed:', directError);
              return NextResponse.json({
                success: false,
                error: 'Failed to insert message after multiple attempts',
                details: {
                  insertError: insertError.message,
                  plpgsqlError: plpgsqlError.message,
                  simpleError: simpleError.message,
                  directError: directError.message
                }
              }, { status: 500 });
            }

            console.log('DIRECT SQL INSERT: Supabase client approach succeeded:', directData);
            return NextResponse.json({
              success: true,
              message: 'Message inserted successfully with Supabase client',
              data: directData[0]
            });
          } catch (directCatchError) {
            console.error('DIRECT SQL INSERT: Supabase client approach caught error:', directCatchError);
            return NextResponse.json({
              success: false,
              error: 'Failed to insert message after multiple attempts',
              details: {
                insertError: insertError.message,
                plpgsqlError: plpgsqlError.message,
                simpleError: simpleError.message,
                directError: directCatchError.message
              }
            }, { status: 500 });
          }
        }

        console.log('DIRECT SQL INSERT: Simple SQL approach succeeded:', simpleData);
        return NextResponse.json({
          success: true,
          message: 'Message inserted successfully with simple SQL',
          data: simpleData
        });
      }

      console.log('DIRECT SQL INSERT: PL/pgSQL approach succeeded:', plpgsqlData);
      return NextResponse.json({
        success: true,
        message: 'Message inserted successfully with PL/pgSQL',
        data: plpgsqlData
      });
    }

    console.log('DIRECT SQL INSERT: Message inserted successfully:', insertData);
    return NextResponse.json({
      success: true,
      message: 'Message inserted successfully',
      data: insertData
    });
  } catch (error) {
    console.error('DIRECT SQL INSERT: Unexpected error:', error);
    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred',
      details: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
