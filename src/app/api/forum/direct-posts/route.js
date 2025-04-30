import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic'; // This ensures the route is always dynamic

export async function GET() {
  try {
    // Initialize Supabase client
    const supabase = createRouteHandlerClient({ cookies });

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

    // If table doesn't exist, create it
    if (!tableExists || !tableExists.data || !tableExists.data[0] || !tableExists.data[0].exists) {
      console.log('Discussion posts table does not exist, creating...');

      // Create the tables
      const { error: createError } = await supabase.rpc('exec_sql', {
        sql: `
          -- Drop tables if they exist
          DROP TABLE IF EXISTS public.discussion_comments;
          DROP TABLE IF EXISTS public.discussion_posts;

          -- Create discussion_posts table
          CREATE TABLE public.discussion_posts (
            id SERIAL PRIMARY KEY,
            user_id TEXT NOT NULL,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );

          -- Create discussion_comments table
          CREATE TABLE public.discussion_comments (
            id SERIAL PRIMARY KEY,
            post_id INTEGER REFERENCES public.discussion_posts(id) ON DELETE CASCADE,
            user_id TEXT NOT NULL,
            content TEXT NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );

          -- Enable RLS on both tables
          ALTER TABLE public.discussion_posts ENABLE ROW LEVEL SECURITY;
          ALTER TABLE public.discussion_comments ENABLE ROW LEVEL SECURITY;

          -- Create policies for discussion_posts
          CREATE POLICY "Anyone can read posts" ON public.discussion_posts FOR SELECT USING (true);
          CREATE POLICY "Anyone can create posts" ON public.discussion_posts FOR INSERT WITH CHECK (true);
          CREATE POLICY "Anyone can update posts" ON public.discussion_posts FOR UPDATE USING (true);
          CREATE POLICY "Anyone can delete posts" ON public.discussion_posts FOR DELETE USING (true);

          -- Create policies for discussion_comments
          CREATE POLICY "Anyone can read comments" ON public.discussion_comments FOR SELECT USING (true);
          CREATE POLICY "Anyone can create comments" ON public.discussion_comments FOR INSERT WITH CHECK (true);
          CREATE POLICY "Anyone can update comments" ON public.discussion_comments FOR UPDATE USING (true);
          CREATE POLICY "Anyone can delete comments" ON public.discussion_comments FOR DELETE USING (true);

          -- No need to create a welcome post anymore
        `
      });

      if (createError) {
        console.error('Error creating forum tables:', createError);
        return NextResponse.json(
          { error: 'Failed to create forum tables' },
          { status: 500 }
        );
      }

      console.log('Forum tables created successfully');
    }

    // Fetch posts using direct SQL with better error handling
    try {
      // Use a simpler query that returns a more predictable format
      const { data: result, error: postsError } = await supabase.rpc('exec_sql', {
        sql: `SELECT id, user_id, title, content, created_at, updated_at FROM public.discussion_posts ORDER BY created_at DESC;`
      });

      if (postsError) {
        console.error('Error fetching posts:', postsError);
        return NextResponse.json(
          { error: 'Failed to fetch posts: ' + postsError.message, details: postsError },
          { status: 500 }
        );
      }

      console.log('Raw SQL result:', result);

      // Handle different possible formats of the result
      let posts = [];

      if (result && Array.isArray(result)) {
        // Direct array of posts
        posts = result;
      } else if (result && Array.isArray(result.data)) {
        // Data property contains array
        posts = result.data;
      } else if (result && typeof result === 'object') {
        // Single post as object
        posts = [result];
      } else {
        console.error('Unexpected posts data format:', result);
        return NextResponse.json(
          { error: 'Unexpected posts data format', posts: [], debug: { result } },
          { status: 500 }
        );
      }

      console.log('Processed posts:', posts);

      // Format the posts with safe access to properties
      const formattedPosts = posts.map(post => ({
        id: post.id || 0,
        user_id: post.user_id || 'anonymous',
        title: post.title || 'Untitled Post',
        content: post.content || 'No content',
        created_at: post.created_at || new Date().toISOString(),
        updated_at: post.updated_at || new Date().toISOString(),
        author_name: 'Anonymous',
        author_role: 'user'
      }));

      return NextResponse.json({ posts: formattedPosts });
    } catch (sqlError) {
      console.error('SQL error in direct-posts API:', sqlError);
      return NextResponse.json(
        { error: 'SQL error: ' + sqlError.message, posts: [] },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Unexpected error in direct-posts API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
