import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic'; // This ensures the route is always dynamic

export async function GET() {
  try {
    // Initialize Supabase client
    const supabase = createRouteHandlerClient({ cookies });

    // Get the session if available
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    console.log('Initializing forum tables...');

    // Check if user is an admin
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (profileError || !userProfile || (userProfile.role !== 'admin' && userProfile.role !== 'counselor')) {
      console.error('User is not authorized to initialize forum tables:', profileError || 'Not admin/counselor');
      return NextResponse.json(
        { error: 'Only administrators and counselors can initialize forum tables' },
        { status: 403 }
      );
    }

    // Create discussion_posts table if it doesn't exist
    const { error: postsTableError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.discussion_posts (
          id SERIAL PRIMARY KEY,
          user_id TEXT NOT NULL,
          title TEXT NOT NULL,
          content TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Enable RLS
        ALTER TABLE public.discussion_posts ENABLE ROW LEVEL SECURITY;

        -- Create policy for users to read all posts
        DROP POLICY IF EXISTS "Anyone can read posts" ON public.discussion_posts;
        CREATE POLICY "Anyone can read posts"
          ON public.discussion_posts
          FOR SELECT
          USING (true);

        -- Create policy for anyone to create posts
        DROP POLICY IF EXISTS "Anyone can create posts" ON public.discussion_posts;
        CREATE POLICY "Anyone can create posts"
          ON public.discussion_posts
          FOR INSERT
          WITH CHECK (true);

        -- Create policy for anyone to update posts
        DROP POLICY IF EXISTS "Anyone can update posts" ON public.discussion_posts;
        CREATE POLICY "Anyone can update posts"
          ON public.discussion_posts
          FOR UPDATE
          USING (true);
      `
    });

    if (postsTableError) {
      console.error('Error creating discussion_posts table:', postsTableError);
      return NextResponse.json(
        { error: `Failed to create discussion_posts table: ${postsTableError.message}` },
        { status: 500 }
      );
    }

    // Create discussion_comments table if it doesn't exist
    const { error: commentsTableError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.discussion_comments (
          id SERIAL PRIMARY KEY,
          post_id INTEGER REFERENCES public.discussion_posts(id) ON DELETE CASCADE,
          user_id TEXT NOT NULL,
          content TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Enable RLS
        ALTER TABLE public.discussion_comments ENABLE ROW LEVEL SECURITY;

        -- Create policy for users to read all comments
        DROP POLICY IF EXISTS "Anyone can read comments" ON public.discussion_comments;
        CREATE POLICY "Anyone can read comments"
          ON public.discussion_comments
          FOR SELECT
          USING (true);

        -- Create policy for anyone to create comments
        DROP POLICY IF EXISTS "Anyone can create comments" ON public.discussion_comments;
        CREATE POLICY "Anyone can create comments"
          ON public.discussion_comments
          FOR INSERT
          WITH CHECK (true);

        -- Create policy for anyone to update comments
        DROP POLICY IF EXISTS "Anyone can update comments" ON public.discussion_comments;
        CREATE POLICY "Anyone can update comments"
          ON public.discussion_comments
          FOR UPDATE
          USING (true);
      `
    });

    if (commentsTableError) {
      console.error('Error creating discussion_comments table:', commentsTableError);
      return NextResponse.json(
        { error: `Failed to create discussion_comments table: ${commentsTableError.message}` },
        { status: 500 }
      );
    }

    // Create a test post
    const { data: post, error: postError } = await supabase
      .from('discussion_posts')
      .insert({
        user_id: session.user.id,
        title: 'Welcome to the Community Forum',
        content: 'This is a space for community members to share their experiences and support each other. Counselors can provide professional guidance on posts.'
      })
      .select()
      .single();

    if (postError) {
      console.error('Error creating test post:', postError);
      // Continue even if test post creation fails
    }

    return NextResponse.json({
      success: true,
      message: 'Forum tables initialized successfully',
      testPost: post || null
    });
  } catch (error) {
    console.error('Unexpected error in init-tables API:', error);
    return NextResponse.json(
      { error: `Internal server error: ${error.message}` },
      { status: 500 }
    );
  }
}
