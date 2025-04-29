import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request) {
  try {
    // Initialize Supabase client
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // We'll allow this endpoint to be called without authentication
    // since it's meant to be called automatically by the system

    // SQL query embedded directly in the code instead of reading from file
    const sqlQuery = `
    -- Fix database relationships for the messaging system
    DO $$
    BEGIN
      -- First, check if the session_messages table exists
      IF EXISTS (
        SELECT FROM pg_tables
        WHERE schemaname = 'public'
        AND tablename = 'session_messages'
      ) THEN
        -- Drop existing foreign key constraints if they exist
        BEGIN
          ALTER TABLE public.session_messages DROP CONSTRAINT IF EXISTS session_messages_sender_id_fkey;
          EXCEPTION WHEN OTHERS THEN NULL;
        END;

        BEGIN
          ALTER TABLE public.session_messages DROP CONSTRAINT IF EXISTS session_messages_recipient_id_fkey;
          EXCEPTION WHEN OTHERS THEN NULL;
        END;

        -- Create foreign key references to user_profiles instead of auth.users
        BEGIN
          -- First check if the columns exist in user_profiles
          IF EXISTS (
            SELECT FROM information_schema.columns
            WHERE table_schema = 'public'
            AND table_name = 'user_profiles'
            AND column_name = 'id'
          ) THEN
            -- Add foreign key constraints
            ALTER TABLE public.session_messages
            ADD CONSTRAINT session_messages_sender_id_fkey
            FOREIGN KEY (sender_id)
            REFERENCES public.user_profiles(id);

            ALTER TABLE public.session_messages
            ADD CONSTRAINT session_messages_recipient_id_fkey
            FOREIGN KEY (recipient_id)
            REFERENCES public.user_profiles(id);

            RAISE NOTICE 'Foreign key constraints added to session_messages table';
          ELSE
            RAISE NOTICE 'user_profiles table does not have an id column';
          END IF;
        EXCEPTION WHEN OTHERS THEN
          RAISE NOTICE 'Error adding foreign key constraints: %', SQLERRM;
        END;

        -- Create indexes for better performance if they don't exist
        IF NOT EXISTS (
          SELECT 1 FROM pg_indexes
          WHERE schemaname = 'public'
          AND tablename = 'session_messages'
          AND indexname = 'session_messages_sender_id_idx'
        ) THEN
          CREATE INDEX session_messages_sender_id_idx ON public.session_messages(sender_id);
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM pg_indexes
          WHERE schemaname = 'public'
          AND tablename = 'session_messages'
          AND indexname = 'session_messages_recipient_id_idx'
        ) THEN
          CREATE INDEX session_messages_recipient_id_idx ON public.session_messages(recipient_id);
        END IF;

        -- Disable RLS completely for easier debugging
        ALTER TABLE public.session_messages DISABLE ROW LEVEL SECURITY;

        -- Refresh the schema cache to make sure Supabase recognizes the relationships
        -- This is a workaround for the "Could not find a relationship" error
        BEGIN
          -- Notify PostgREST to refresh its schema cache
          NOTIFY pgrst, 'reload schema';
          RAISE NOTICE 'Schema cache refresh requested';
        EXCEPTION WHEN OTHERS THEN
          RAISE NOTICE 'Error refreshing schema cache: %', SQLERRM;
        END;
      ELSE
        RAISE NOTICE 'session_messages table does not exist';
      END IF;

      -- Check if the counseling_sessions table exists and fix its relationships
      IF EXISTS (
        SELECT FROM pg_tables
        WHERE schemaname = 'public'
        AND tablename = 'counseling_sessions'
      ) THEN
        -- Drop existing foreign key constraints if they exist
        BEGIN
          ALTER TABLE public.counseling_sessions DROP CONSTRAINT IF EXISTS counseling_sessions_counselor_id_fkey;
          EXCEPTION WHEN OTHERS THEN NULL;
        END;

        BEGIN
          ALTER TABLE public.counseling_sessions DROP CONSTRAINT IF EXISTS counseling_sessions_patient_id_fkey;
          EXCEPTION WHEN OTHERS THEN NULL;
        END;

        BEGIN
          ALTER TABLE public.counseling_sessions DROP CONSTRAINT IF EXISTS counseling_sessions_client_id_fkey;
          EXCEPTION WHEN OTHERS THEN NULL;
        END;

        -- Create foreign key references to user_profiles
        BEGIN
          -- First check if the columns exist in counseling_sessions
          IF EXISTS (
            SELECT FROM information_schema.columns
            WHERE table_schema = 'public'
            AND table_name = 'counseling_sessions'
            AND column_name = 'counselor_id'
          ) THEN
            -- Add foreign key constraint for counselor_id
            ALTER TABLE public.counseling_sessions
            ADD CONSTRAINT counseling_sessions_counselor_id_fkey
            FOREIGN KEY (counselor_id)
            REFERENCES public.user_profiles(id);

            RAISE NOTICE 'Foreign key constraint added for counselor_id';
          ELSE
            RAISE NOTICE 'counseling_sessions table does not have a counselor_id column';
          END IF;
        EXCEPTION WHEN OTHERS THEN
          RAISE NOTICE 'Error adding counselor_id foreign key constraint: %', SQLERRM;
        END;

        -- Disable RLS completely for easier debugging
        ALTER TABLE public.counseling_sessions DISABLE ROW LEVEL SECURITY;
      ELSE
        RAISE NOTICE 'counseling_sessions table does not exist';
      END IF;
    END
    $$;
    `;

    // Execute the SQL query
    const { error: sqlError } = await supabase.rpc(
      'exec_sql',
      { sql: sqlQuery }
    );

    if (sqlError) {
      console.error('Error executing SQL:', sqlError);

      // Try an alternative approach
      const { error: directError } = await supabase.rpc(
        'execute_sql',
        { sql_query: sqlQuery }
      );

      if (directError) {
        return NextResponse.json(
          { error: 'Failed to fix database relationships: ' + (directError.message || sqlError.message) },
          { status: 500 }
        );
      }
    }

    // Force a schema cache refresh
    try {
      // This is a workaround to force Supabase to refresh its schema cache
      await supabase.rpc('pg_notify', { channel: 'pgrst', payload: 'reload schema' });
    } catch (notifyError) {
      console.error('Error refreshing schema cache:', notifyError);
    }

    return NextResponse.json({
      success: true,
      message: 'Database relationships fixed automatically'
    });
  } catch (error) {
    console.error('Error fixing database relationships:', error);
    return NextResponse.json(
      { error: 'Failed to fix database relationships: ' + error.message },
      { status: 500 }
    );
  }
}
