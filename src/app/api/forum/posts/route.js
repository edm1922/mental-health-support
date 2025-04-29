import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic'; // This ensures the route is always dynamic

export async function GET() {
  try {
    // Initialize Supabase client
    const supabase = createRouteHandlerClient({ cookies });

    // Get the session if available (not required for viewing posts)
    const { data: { session } } = await supabase.auth.getSession();
    console.log('Session:', session ? 'User is authenticated' : 'No session');

    // Check if discussion_posts table exists
    const { data: tableExists, error: tableCheckError } = await supabase.rpc('exec_sql', {
      sql: `SELECT EXISTS (
        SELECT FROM pg_tables
        WHERE schemaname = 'public'
        AND tablename = 'discussion_posts'
      );`
    });

    if (tableCheckError) {
      console.error('Error checking if discussion_posts table exists:', tableCheckError);
      return NextResponse.json(
        { error: 'Error checking if forum tables exist' },
        { status: 500 }
      );
    }

    // Always recreate the tables if they don't exist or if we're forcing a recreation
    const forceRecreate = false; // Set to false to avoid recreating tables on every request
    if (forceRecreate || !tableExists || !tableExists.data || !tableExists.data[0] || !tableExists.data[0].exists) {
      console.log('Dropping existing tables first...');

      // Drop the discussion_comments table first (because it has a foreign key to discussion_posts)
      const { error: dropCommentsError } = await supabase.rpc('exec_sql', {
        sql: `DROP TABLE IF EXISTS public.discussion_comments;`
      });

      if (dropCommentsError) {
        console.error('Error dropping discussion_comments table:', dropCommentsError);
      }

      // Now drop the discussion_posts table
      const { error: dropPostsError } = await supabase.rpc('exec_sql', {
        sql: `DROP TABLE IF EXISTS public.discussion_posts;`
      });

      if (dropPostsError) {
        console.error('Error dropping discussion_posts table:', dropPostsError);
      }
      console.log('Creating or recreating discussion posts table...');

      // Create discussion_posts table
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

          -- Create policy for users to create posts
          DROP POLICY IF EXISTS "Anyone can create posts" ON public.discussion_posts;
          CREATE POLICY "Anyone can create posts"
            ON public.discussion_posts
            FOR INSERT
            WITH CHECK (true);

          -- Create policy for users to update posts
          DROP POLICY IF EXISTS "Anyone can update posts" ON public.discussion_posts;
          CREATE POLICY "Anyone can update posts"
            ON public.discussion_posts
            FOR UPDATE
            USING (true);
        `
      });

      if (postsTableError) {
        console.error('Error creating discussion_posts table:', postsTableError);
        return NextResponse.json({ posts: [], tableNotFound: true, error: postsTableError.message });
      }

      // Create discussion_comments table
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

          -- Create policy for users to create comments
          DROP POLICY IF EXISTS "Anyone can create comments" ON public.discussion_comments;
          CREATE POLICY "Anyone can create comments"
            ON public.discussion_comments
            FOR INSERT
            WITH CHECK (true);

          -- Create policy for users to update comments
          DROP POLICY IF EXISTS "Anyone can update comments" ON public.discussion_comments;
          CREATE POLICY "Anyone can update comments"
            ON public.discussion_comments
            FOR UPDATE
            USING (true);
        `
      });

      if (commentsTableError) {
        console.error('Error creating discussion_comments table:', commentsTableError);
        return NextResponse.json({ posts: [], tableNotFound: true, error: commentsTableError.message });
      }

      // Create a test post if user is authenticated
      if (session && session.user) {
        console.log('Creating test post...');
        const { error: postError } = await supabase
          .from('discussion_posts')
          .insert({
            user_id: session.user.id,
            title: 'Welcome to the Community Forum',
            content: 'This is a space for community members to share their experiences and support each other. Counselors can provide professional guidance on posts.'
          });

        if (postError) {
          console.error('Error creating test post:', postError);
          // Continue even if test post creation fails
        }
      }
    }

    // Fetch posts with author information
    try {
      console.log('Attempting to fetch posts...');
      // First, let's check if the user_profiles table exists
      const { data: profilesExist, error: profilesError } = await supabase
        .from('user_profiles')
        .select('id')
        .limit(1);

      console.log('Profiles check:', { profilesExist, profilesError });

      // Check posts using direct SQL first
      const { data: sqlPosts, error: sqlError } = await supabase.rpc('exec_sql', {
        sql: `SELECT * FROM public.discussion_posts ORDER BY created_at DESC LIMIT 10;`
      });

      console.log('SQL posts check:', sqlPosts, sqlError);

      // Fetch posts using the API
      const { data: posts, error } = await supabase
        .from('discussion_posts')
        .select('*')
        .order('created_at', { ascending: false });

      // Format the posts with default author information
      const formattedPosts = (posts || []).map(post => ({
        ...post,
        author_name: 'Anonymous',
        author_role: 'user'
      }));

      if (error) {
        console.error('Error fetching posts:', error);
        return NextResponse.json(
          { error: `Failed to fetch posts: ${error.message}` },
          { status: 500 }
        );
      }

      console.log('Posts fetched successfully:', posts?.length || 0, 'posts found');
      return NextResponse.json({ posts: formattedPosts });
    } catch (fetchError) {
      console.error('Exception fetching posts:', fetchError);
      return NextResponse.json(
        { error: `Exception fetching posts: ${fetchError.message}` },
        { status: 500 }
      );
    }

    // This code is now unreachable due to the early return in the try/catch block above
  } catch (error) {
    console.error('Unexpected error in posts API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
