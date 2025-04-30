import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic'; // This ensures the route is always dynamic

export async function POST(request) {
  try {
    // Get the post data from the request body
    const { title, content } = await request.json();

    if (!title || !content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      );
    }

    // Initialize Supabase client
    const supabase = createRouteHandlerClient({ cookies });

    // Check if the table exists first
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

    // Now insert the post with better error handling
    try {
      // First, verify the table exists by checking if we can select from it
      const { data: tableCheck, error: checkError } = await supabase.rpc('exec_sql', {
        sql: `SELECT COUNT(*) FROM public.discussion_posts;`
      });

      if (checkError) {
        console.error('Error checking discussion_posts table:', checkError);
        return NextResponse.json(
          { error: `Failed to verify forum tables: ${checkError.message}` },
          { status: 500 }
        );
      }

      console.log('Table check result:', tableCheck);

      // Now insert the post
      const { data: result, error } = await supabase.rpc('exec_sql', {
        sql: `
          INSERT INTO public.discussion_posts (user_id, title, content)
          VALUES ('anonymous', '${title.replace(/'/g, "''")}', '${content.replace(/'/g, "''")}')
          RETURNING id, user_id, title, content, created_at, updated_at;
        `
      });

      if (error) {
        console.error('Error creating post with direct SQL:', error);
        return NextResponse.json(
          { error: `Failed to create post: ${error.message}` },
          { status: 500 }
        );
      }

      console.log('Raw SQL insert result:', result);

      // Handle different possible formats of the result
      let createdPost = null;

      if (result && Array.isArray(result) && result.length > 0) {
        // Array with the first element being the created post
        createdPost = result[0];
      } else if (result && typeof result === 'object') {
        // Direct object representing the post
        createdPost = result;
      }

      if (!createdPost) {
        console.error('Post created but returned unexpected format:', result);
      } else {
        console.log('Post created successfully:', createdPost);
      }

      // Fetch all posts to return
      const { data: allPosts, error: fetchError } = await supabase.rpc('exec_sql', {
        sql: `SELECT id, user_id, title, content, created_at, updated_at FROM public.discussion_posts ORDER BY created_at DESC LIMIT 10;`
      });

      if (fetchError) {
        console.error('Error fetching posts after creation:', fetchError);
      } else {
        console.log('Posts after creation:', allPosts);
      }

      return NextResponse.json({
        success: true,
        post: createdPost,
        allPosts: allPosts || []
      });
    } catch (sqlError) {
      console.error('SQL error in direct-create-post API:', sqlError);
      return NextResponse.json(
        { error: `SQL error: ${sqlError.message}` },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Unexpected error in direct-create-post API:', error);
    return NextResponse.json(
      { error: `Internal server error: ${error.message}` },
      { status: 500 }
    );
  }
}
