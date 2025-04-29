import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Initialize Supabase client with cookies
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    console.log('Create insert_message function API called');

    // SQL query embedded directly in the code instead of reading from file
    const sql = `
    -- Create a function to insert a message
    CREATE OR REPLACE FUNCTION insert_message(
      p_session_id UUID,
      p_sender_id UUID,
      p_recipient_id UUID,
      p_message TEXT
    )
    RETURNS JSONB
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    DECLARE
      v_result JSONB;
    BEGIN
      -- Insert the message
      INSERT INTO public.session_messages (
        session_id,
        sender_id,
        recipient_id,
        message,
        is_read
      ) VALUES (
        p_session_id,
        p_sender_id,
        p_recipient_id,
        p_message,
        false
      )
      RETURNING jsonb_build_object(
        'id', id,
        'session_id', session_id,
        'sender_id', sender_id,
        'recipient_id', recipient_id,
        'message', message,
        'is_read', is_read,
        'created_at', created_at
      ) INTO v_result;

      RETURN v_result;
    EXCEPTION
      WHEN OTHERS THEN
        RETURN jsonb_build_object(
          'error', SQLERRM,
          'detail', SQLSTATE
        );
    END;
    $$;
    `;

    // Execute the SQL
    const { error } = await supabase.rpc('exec_sql', { sql });

    if (error) {
      console.error('Error creating insert_message function:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to create insert_message function: ' + error.message
      });
    }

    return NextResponse.json({
      success: true,
      message: 'insert_message function created successfully'
    });
  } catch (error) {
    console.error('Error in create insert_message function API:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
