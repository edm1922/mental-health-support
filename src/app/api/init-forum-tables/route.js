import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic'; // This ensures the route is always dynamic

export async function POST() {
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

    // Check if discussion_posts table exists
    const { data: postsTableExists, error: postsTableError } = await supabase.rpc('exec_sql', {
      sql: `SELECT EXISTS (
        SELECT FROM pg_tables
        WHERE schemaname = 'public'
        AND tablename = 'discussion_posts'
      );`
    });

    if (postsTableError) {
      console.error("Error checking discussion_posts table:", postsTableError);
      return NextResponse.json(
        { error: `Error checking discussion_posts table: ${postsTableError.message}` },
        { status: 500 }
      );
    }

    // Create discussion_posts table if it doesn't exist
    if (!postsTableExists || !postsTableExists.data || !postsTableExists.data[0] || !postsTableExists.data[0].exists) {
      console.log("Creating discussion_posts table...");
      const { error: createPostsError } = await supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE public.discussion_posts (
            id SERIAL PRIMARY KEY,
            user_id TEXT NOT NULL,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );

          -- Add indexes for better performance
          CREATE INDEX IF NOT EXISTS discussion_posts_user_id_idx ON public.discussion_posts(user_id);
        `
      });

      if (createPostsError) {
        console.error("Error creating discussion_posts table:", createPostsError);
        return NextResponse.json(
          { error: `Error creating discussion_posts table: ${createPostsError.message}` },
          { status: 500 }
        );
      }
    }

    // Check if discussion_comments table exists
    const { data: commentsTableExists, error: commentsTableError } = await supabase.rpc('exec_sql', {
      sql: `SELECT EXISTS (
        SELECT FROM pg_tables
        WHERE schemaname = 'public'
        AND tablename = 'discussion_comments'
      );`
    });

    if (commentsTableError) {
      console.error("Error checking discussion_comments table:", commentsTableError);
      return NextResponse.json(
        { error: `Error checking discussion_comments table: ${commentsTableError.message}` },
        { status: 500 }
      );
    }

    // Create discussion_comments table if it doesn't exist
    if (!commentsTableExists || !commentsTableExists.data || !commentsTableExists.data[0] || !commentsTableExists.data[0].exists) {
      console.log("Creating discussion_comments table...");
      const { error: createCommentsError } = await supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE public.discussion_comments (
            id SERIAL PRIMARY KEY,
            post_id INTEGER NOT NULL,
            user_id TEXT NOT NULL,
            content TEXT NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );

          -- Add indexes for better performance
          CREATE INDEX IF NOT EXISTS discussion_comments_post_id_idx ON public.discussion_comments(post_id);
          CREATE INDEX IF NOT EXISTS discussion_comments_user_id_idx ON public.discussion_comments(user_id);
        `
      });

      if (createCommentsError) {
        console.error("Error creating discussion_comments table:", createCommentsError);
        return NextResponse.json(
          { error: `Error creating discussion_comments table: ${createCommentsError.message}` },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ success: true, message: "Forum tables initialized successfully!" });
  } catch (error) {
    console.error("Unexpected error in init-forum-tables API:", error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
