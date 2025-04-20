"use client";
import { supabase } from "@/utils/supabaseClient";

export async function initForumTables() {
  try {
    console.log("Checking if discussion tables exist...");

    // Check if discussion_posts table exists
    const { data: postsTableExists, error: postsTableError } = await supabase.rpc('exec_sql', {
      sql: `SELECT EXISTS (
        SELECT FROM pg_tables
        WHERE schemaname = 'public'
        AND tablename = 'discussion_posts'
      );`
    });

    if (postsTableError && postsTableError.code !== 'PGRST116') {
      console.error("Error checking discussion_posts table:", postsTableError);
      throw new Error(`Error checking discussion_posts table: ${postsTableError.message}`);
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
        throw new Error(`Error creating discussion_posts table: ${createPostsError.message}`);
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

    if (commentsTableError && commentsTableError.code !== 'PGRST116') {
      console.error("Error checking discussion_comments table:", commentsTableError);
      throw new Error(`Error checking discussion_comments table: ${commentsTableError.message}`);
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
        throw new Error(`Error creating discussion_comments table: ${createCommentsError.message}`);
      }
    }

    console.log("Forum tables initialized successfully!");
    return { success: true };
  } catch (error) {
    console.error("Error initializing forum tables:", error);
    throw error;
  }
}
