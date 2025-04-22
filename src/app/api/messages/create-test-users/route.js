import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    // Initialize Supabase client
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    console.log('CREATE TEST USERS: Starting creation');

    // Create patient user
    const senderSql = `
      INSERT INTO public.user_profiles (
        id,
        display_name,
        role,
        created_at,
        updated_at
      ) VALUES (
        '4fd19577-3876-4087-b18b-51a7b194460a'::uuid,
        'Patient User',
        'user',
        now(),
        now()
      )
      ON CONFLICT (id) DO UPDATE
      SET display_name = 'Patient User', updated_at = now()
      RETURNING *;
    `;

    const { data: sender, error: senderError } = await supabase.rpc('exec_sql', {
      sql: senderSql
    });

    if (senderError) {
      console.error('CREATE TEST USERS: Error creating sender:', senderError);
      return NextResponse.json({
        success: false,
        error: 'Error creating sender',
        details: senderError.message
      }, { status: 500 });
    }

    console.log('CREATE TEST USERS: Sender created or updated:', sender);

    // Create counselor user
    const recipientSql = `
      INSERT INTO public.user_profiles (
        id,
        display_name,
        role,
        created_at,
        updated_at
      ) VALUES (
        '1ccdfb9d-df48-4250-ba89-68c181b8c012'::uuid,
        'Counselor User',
        'counselor',
        now(),
        now()
      )
      ON CONFLICT (id) DO UPDATE
      SET display_name = 'Counselor User', updated_at = now()
      RETURNING *;
    `;

    const { data: recipient, error: recipientError } = await supabase.rpc('exec_sql', {
      sql: recipientSql
    });

    if (recipientError) {
      console.error('CREATE TEST USERS: Error creating recipient:', recipientError);
      return NextResponse.json({
        success: false,
        error: 'Error creating recipient',
        details: recipientError.message
      }, { status: 500 });
    }

    console.log('CREATE TEST USERS: Recipient created or updated:', recipient);

    // Get the session ID from the request
    const { sessionId } = await request.json();

    // If a session ID was provided, check if it exists
    if (sessionId) {
      const sessionCheckSql = `
        SELECT * FROM public.counseling_sessions
        WHERE id = '${sessionId}'::uuid;
      `;

      const { data: sessionCheck, error: sessionCheckError } = await supabase.rpc('exec_sql', {
        sql: sessionCheckSql
      });

      if (sessionCheckError) {
        console.error('CREATE TEST USERS: Error checking session:', sessionCheckError);
      } else {
        const sessionExists = sessionCheck && sessionCheck.length > 0;

        if (!sessionExists) {
          // Create a test session
          const sessionSql = `
            INSERT INTO public.counseling_sessions (
              id,
              counselor_id,
              patient_id,
              session_date,
              status,
              created_at,
              updated_at,
              duration,
              type
            ) VALUES (
              '${sessionId}'::uuid,
              '1ccdfb9d-df48-4250-ba89-68c181b8c012'::uuid,
              '4fd19577-3876-4087-b18b-51a7b194460a'::uuid,
              now(),
              'scheduled',
              now(),
              now(),
              60,
              'one_on_one'
            )
            ON CONFLICT (id) DO UPDATE
            SET updated_at = now()
            RETURNING *;
          `;

          const { data: session, error: sessionError } = await supabase.rpc('exec_sql', {
            sql: sessionSql
          });

          if (sessionError) {
            console.error('CREATE TEST USERS: Error creating session:', sessionError);
            return NextResponse.json({
              success: false,
              error: 'Error creating session',
              details: sessionError.message
            }, { status: 500 });
          }

          console.log('CREATE TEST USERS: Session created or updated:', session);
        }
      }
    }

    return NextResponse.json({
      success: true,
      sender,
      recipient
    });
  } catch (error) {
    console.error('CREATE TEST USERS: Unexpected error:', error);
    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred',
      details: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
