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

    // Execute SQL to fix the schema
    const { error } = await supabase.rpc('exec_sql', {
      sql: `
        -- Drop existing tables
        DROP TABLE IF EXISTS public.discussion_comments;
        DROP TABLE IF EXISTS public.discussion_posts;
        DROP TABLE IF EXISTS public.forum_comments;
        DROP TABLE IF EXISTS public.forum_posts;

        -- Create discussion_posts table with proper schema
        CREATE TABLE public.discussion_posts (
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

        -- Create discussion_comments table with proper schema
        CREATE TABLE public.discussion_comments (
          id SERIAL PRIMARY KEY,
          post_id INTEGER REFERENCES public.discussion_posts(id) ON DELETE CASCADE,
          user_id UUID,
          content TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Create forum_posts table for admin moderation
        CREATE TABLE public.forum_posts (
          id SERIAL PRIMARY KEY,
          user_id UUID,
          title TEXT NOT NULL,
          content TEXT NOT NULL,
          is_approved BOOLEAN DEFAULT FALSE,
          is_flagged BOOLEAN DEFAULT FALSE,
          is_pinned BOOLEAN DEFAULT FALSE,
          is_removed BOOLEAN DEFAULT FALSE,
          report_count INTEGER DEFAULT 0,
          approved_by UUID,
          approved_at TIMESTAMP WITH TIME ZONE,
          moderated_by UUID,
          moderated_at TIMESTAMP WITH TIME ZONE,
          pinned_by UUID,
          pinned_at TIMESTAMP WITH TIME ZONE,
          removed_by UUID,
          removed_at TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Create forum_comments table for admin moderation
        CREATE TABLE public.forum_comments (
          id SERIAL PRIMARY KEY,
          post_id INTEGER REFERENCES public.forum_posts(id) ON DELETE CASCADE,
          user_id UUID,
          content TEXT NOT NULL,
          is_flagged BOOLEAN DEFAULT FALSE,
          is_removed BOOLEAN DEFAULT FALSE,
          report_count INTEGER DEFAULT 0,
          moderated_by UUID,
          moderated_at TIMESTAMP WITH TIME ZONE,
          removed_by UUID,
          removed_at TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Create indexes
        CREATE INDEX IF NOT EXISTS discussion_posts_user_id_idx ON public.discussion_posts(user_id);
        CREATE INDEX IF NOT EXISTS discussion_comments_user_id_idx ON public.discussion_comments(user_id);
        CREATE INDEX IF NOT EXISTS discussion_comments_post_id_idx ON public.discussion_comments(post_id);

        CREATE INDEX IF NOT EXISTS forum_posts_user_id_idx ON public.forum_posts(user_id);
        CREATE INDEX IF NOT EXISTS forum_comments_user_id_idx ON public.forum_comments(user_id);
        CREATE INDEX IF NOT EXISTS forum_comments_post_id_idx ON public.forum_comments(post_id);

        -- Enable RLS
        ALTER TABLE public.discussion_posts ENABLE ROW LEVEL SECURITY;
        ALTER TABLE public.discussion_comments ENABLE ROW LEVEL SECURITY;
        ALTER TABLE public.forum_posts ENABLE ROW LEVEL SECURITY;
        ALTER TABLE public.forum_comments ENABLE ROW LEVEL SECURITY;

        -- Create simplified policies
        -- Allow anyone to read posts
        CREATE POLICY "Anyone can read posts"
          ON public.discussion_posts FOR SELECT
          USING (true);

        -- Allow anyone to insert posts (we'll handle auth in the API)
        CREATE POLICY "Anyone can create posts"
          ON public.discussion_posts FOR INSERT
          WITH CHECK (true);

        -- Allow users to update their own posts
        CREATE POLICY "Users can update their own posts"
          ON public.discussion_posts FOR UPDATE
          USING (auth.uid()::text = user_id::text);

        -- Allow users to delete their own posts
        CREATE POLICY "Users can delete their own posts"
          ON public.discussion_posts FOR DELETE
          USING (auth.uid()::text = user_id::text);

        -- Allow anyone to read comments
        CREATE POLICY "Anyone can read comments"
          ON public.discussion_comments FOR SELECT
          USING (true);

        -- Allow anyone to insert comments (we'll handle auth in the API)
        CREATE POLICY "Anyone can create comments"
          ON public.discussion_comments FOR INSERT
          WITH CHECK (true);

        -- Allow users to update their own comments
        CREATE POLICY "Users can update their own comments"
          ON public.discussion_comments FOR UPDATE
          USING (auth.uid()::text = user_id::text);

        -- Allow users to delete their own comments
        CREATE POLICY "Users can delete their own comments"
          ON public.discussion_comments FOR DELETE
          USING (auth.uid()::text = user_id::text);

        -- Forum posts policies
        CREATE POLICY "Anyone can read forum posts"
          ON public.forum_posts FOR SELECT
          USING (true);

        CREATE POLICY "Anyone can create forum posts"
          ON public.forum_posts FOR INSERT
          WITH CHECK (true);

        CREATE POLICY "Users can update their own forum posts"
          ON public.forum_posts FOR UPDATE
          USING (auth.uid()::text = user_id::text);

        CREATE POLICY "Users can delete their own forum posts"
          ON public.forum_posts FOR DELETE
          USING (auth.uid()::text = user_id::text);

        -- Forum comments policies
        CREATE POLICY "Anyone can read forum comments"
          ON public.forum_comments FOR SELECT
          USING (true);

        CREATE POLICY "Anyone can create forum comments"
          ON public.forum_comments FOR INSERT
          WITH CHECK (true);

        CREATE POLICY "Users can update their own forum comments"
          ON public.forum_comments FOR UPDATE
          USING (auth.uid()::text = user_id::text);

        CREATE POLICY "Users can delete their own forum comments"
          ON public.forum_comments FOR DELETE
          USING (auth.uid()::text = user_id::text);
      `
    });

    if (error) {
      console.error('Error fixing schema:', error);
      return NextResponse.json(
        { error: 'Failed to fix schema: ' + error.message },
        { status: 500 }
      );
    }

    // Create test posts if the user is authenticated
    if (session?.user) {
      // Create a test discussion post
      const { error: discussionPostError } = await supabase
        .from('discussion_posts')
        .insert({
          user_id: session.user.id,
          title: 'Welcome to the Community Forum',
          content: 'This is a test post to verify that the forum is working correctly.',
          is_approved: true // This one is approved so it shows up immediately
        });

      if (discussionPostError) {
        console.error('Error creating test discussion post:', discussionPostError);
      }

      // Create a test forum post for moderation
      const { error: forumPostError } = await supabase
        .from('forum_posts')
        .insert({
          user_id: session.user.id,
          title: 'Welcome to the Forum Moderation',
          content: 'This is a test post to verify that the forum moderation is working correctly.',
          is_approved: false,
          is_flagged: true,
          report_count: 1
        });

      if (forumPostError) {
        console.error('Error creating test forum post:', forumPostError);
        return NextResponse.json({
          success: true,
          message: 'Schema fixed successfully, but failed to create test forum post',
          error: forumPostError.message
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Schema fixed successfully'
    });
  } catch (error) {
    console.error('Unexpected error in fix-schema API:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}
