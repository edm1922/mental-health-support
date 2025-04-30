import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request) {
  try {
    // Initialize Supabase client
    const supabase = createRouteHandlerClient({ cookies });

    // Verify the user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if the user is an admin
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (profileError || userProfile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Check if the counseling_sessions table exists
    const { data: tableExists, error: tableCheckError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT EXISTS (
          SELECT FROM pg_tables
          WHERE schemaname = 'public'
          AND tablename = 'counseling_sessions'
        );
      `
    });

    if (tableCheckError) {
      console.error('Error checking if table exists:', tableCheckError);
      return NextResponse.json(
        { error: 'Failed to check if table exists' },
        { status: 500 }
      );
    }

    // If the table doesn't exist, create it
    if (!tableExists) {
      const { error: createTableError } = await supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE public.counseling_sessions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            counselor_id UUID REFERENCES auth.users(id),
            client_id UUID REFERENCES auth.users(id),
            session_date TIMESTAMP WITH TIME ZONE NOT NULL,
            duration INTEGER DEFAULT 60,
            status TEXT DEFAULT 'scheduled',
            notes TEXT,
            video_enabled BOOLEAN DEFAULT false,
            video_room_id TEXT,
            video_join_url TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `
      });

      if (createTableError) {
        console.error('Error creating table:', createTableError);
        return NextResponse.json(
          { error: 'Failed to create table' },
          { status: 500 }
        );
      }

      return NextResponse.json({ message: 'Table created successfully' });
    }

    // If the table exists, check if it has all the required columns
    const { data: columnsExist, error: columnsCheckError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT
          EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'counseling_sessions' AND column_name = 'counselor_id') as has_counselor_id,
          EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'counseling_sessions' AND column_name = 'client_id') as has_client_id,
          EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'counseling_sessions' AND column_name = 'video_enabled') as has_video_enabled,
          EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'counseling_sessions' AND column_name = 'video_room_id') as has_video_room_id,
          EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'counseling_sessions' AND column_name = 'video_join_url') as has_video_join_url
      `
    });

    if (columnsCheckError) {
      console.error('Error checking columns:', columnsCheckError);
      return NextResponse.json(
        { error: 'Failed to check columns' },
        { status: 500 }
      );
    }

    // Add any missing columns
    if (!columnsExist.has_counselor_id) {
      console.log('Adding counselor_id column');
      await supabase.rpc('exec_sql', {
        sql: `ALTER TABLE public.counseling_sessions ADD COLUMN counselor_id UUID REFERENCES auth.users(id);`
      });
    }

    if (!columnsExist.has_client_id) {
      console.log('Adding client_id column');
      await supabase.rpc('exec_sql', {
        sql: `ALTER TABLE public.counseling_sessions ADD COLUMN client_id UUID REFERENCES auth.users(id);`
      });
    }

    if (!columnsExist.has_video_enabled) {
      console.log('Adding video_enabled column');
      await supabase.rpc('exec_sql', {
        sql: `ALTER TABLE public.counseling_sessions ADD COLUMN video_enabled BOOLEAN DEFAULT false;`
      });
    }

    if (!columnsExist.has_video_room_id) {
      console.log('Adding video_room_id column');
      await supabase.rpc('exec_sql', {
        sql: `ALTER TABLE public.counseling_sessions ADD COLUMN video_room_id TEXT;`
      });
    }

    if (!columnsExist.has_video_join_url) {
      console.log('Adding video_join_url column');
      await supabase.rpc('exec_sql', {
        sql: `ALTER TABLE public.counseling_sessions ADD COLUMN video_join_url TEXT;`
      });
    }

    return NextResponse.json({ message: 'Table structure updated successfully' });
  } catch (error) {
    console.error('Error updating table structure:', error);
    return NextResponse.json(
      { error: 'Failed to update table structure: ' + error.message },
      { status: 500 }
    );
  }
}
