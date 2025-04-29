import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    // Initialize Supabase client
    const supabase = createRouteHandlerClient({ cookies });

    // Get the session if available
    const { data: { session } } = await supabase.auth.getSession();
    console.log('Session:', session ? 'User is authenticated' : 'No session');

    // Create the discussion_posts table
    const { error: createPostsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.discussion_posts (
          id SERIAL PRIMARY KEY,
          user_id UUID,
          title TEXT NOT NULL,
          content TEXT NOT NULL,
          is_approved BOOLEAN DEFAULT FALSE,
          approved_by UUID,
          approved_at TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    if (createPostsError) {
      console.error('Error creating discussion_posts table:', createPostsError);
      return NextResponse.json(
        { error: 'Failed to create discussion_posts table: ' + createPostsError.message },
        { status: 500 }
      );
    }

    // Create the discussion_comments table
    const { error: createCommentsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.discussion_comments (
          id SERIAL PRIMARY KEY,
          post_id INTEGER REFERENCES public.discussion_posts(id) ON DELETE CASCADE,
          user_id UUID,
          content TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    if (createCommentsError) {
      console.error('Error creating discussion_comments table:', createCommentsError);
      return NextResponse.json(
        { error: 'Failed to create discussion_comments table: ' + createCommentsError.message },
        { status: 500 }
      );
    }

    // Add the is_approved column if it doesn't exist
    const { error: addColumnError } = await supabase.rpc('exec_sql', {
      sql: `
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_name = 'discussion_posts' AND column_name = 'is_approved'
          ) THEN
            ALTER TABLE public.discussion_posts ADD COLUMN is_approved BOOLEAN DEFAULT FALSE;
          END IF;
        END $$;
      `
    });

    if (addColumnError) {
      console.error('Error adding is_approved column:', addColumnError);
      return NextResponse.json(
        { error: 'Failed to add is_approved column: ' + addColumnError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Tables created successfully'
    });
  } catch (error) {
    console.error('Unexpected error in create-tables API:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}
