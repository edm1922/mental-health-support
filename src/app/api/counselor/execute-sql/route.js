import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

// Map of known SQL files and their content
const SQL_FILES = {
  'src/sql/fix_database_relationships.sql': `
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

      -- Disable RLS completely for easier debugging
      ALTER TABLE public.session_messages DISABLE ROW LEVEL SECURITY;
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
  `,
  'src/sql/completely_fix_session_messages.sql': `
  -- First, check if the table exists
  DO $$
  DECLARE
    table_exists BOOLEAN;
  BEGIN
    SELECT EXISTS (
      SELECT FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name = 'session_messages'
    ) INTO table_exists;

    IF NOT table_exists THEN
      -- Create the table if it doesn't exist
      CREATE TABLE public.session_messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        session_id UUID REFERENCES public.counseling_sessions(id),
        sender_id UUID,
        recipient_id UUID,
        message TEXT,
        is_read BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      );

      RAISE NOTICE 'Created session_messages table';
    ELSE
      RAISE NOTICE 'session_messages table already exists';
    END IF;

    -- Disable RLS completely
    ALTER TABLE public.session_messages DISABLE ROW LEVEL SECURITY;
    RAISE NOTICE 'Disabled RLS on session_messages table';

    -- Create the insert_message function
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

    RAISE NOTICE 'Created insert_message function';
  END $$;
  `
};

export async function POST(request) {
  try {
    // Initialize Supabase client
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Get the current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 });
    }

    // Check if user is an admin
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (profileError) {
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch user profile'
      }, { status: 500 });
    }

    if (profile.role !== 'admin') {
      return NextResponse.json({
        success: false,
        error: 'Only admins can execute SQL'
      }, { status: 403 });
    }

    // Get the SQL file path from the request
    const { sqlFile } = await request.json();

    if (!sqlFile) {
      return NextResponse.json({
        success: false,
        error: 'SQL file path is required'
      }, { status: 400 });
    }

    // Get SQL content from our predefined map
    let sqlContent;

    // Normalize the path for comparison
    const normalizedPath = sqlFile.replace(/\\/g, '/');

    if (SQL_FILES[normalizedPath]) {
      sqlContent = SQL_FILES[normalizedPath];
      console.log(`Using predefined SQL content for ${normalizedPath}`);
    } else {
      return NextResponse.json({
        success: false,
        error: `SQL file not found in predefined files: ${normalizedPath}`,
        availableFiles: Object.keys(SQL_FILES)
      }, { status: 404 });
    }

    // Execute the SQL statements one by one
    const sqlStatements = sqlContent.split(';').filter(stmt => stmt.trim());

    for (const stmt of sqlStatements) {
      if (stmt.trim()) {
        const { error } = await supabase.rpc('exec_sql', {
          sql: stmt + ';'
        });

        if (error) {
          console.error('Error executing SQL statement:', error);
          console.error('Statement:', stmt);
          return NextResponse.json({
            success: false,
            error: 'Failed to execute SQL: ' + error.message,
            statement: stmt
          }, { status: 500 });
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'SQL executed successfully'
    });
  } catch (error) {
    console.error('Unexpected error executing SQL:', error);
    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred'
    }, { status: 500 });
  }
}
