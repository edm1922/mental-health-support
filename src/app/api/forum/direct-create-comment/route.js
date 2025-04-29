import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic'; // This ensures the route is always dynamic

export async function POST(request) {
  try {
    // Get the post ID and content from the request body
    const { post_id, content } = await request.json();

    if (!post_id || !content) {
      return NextResponse.json(
        { error: 'Post ID and content are required' },
        { status: 400 }
      );
    }

    // Initialize Supabase client
    const supabase = createRouteHandlerClient({ cookies });

    // Get the session if available
    const { data: { session } } = await supabase.auth.getSession();
    console.log('Session:', session ? 'User is authenticated' : 'No session');

    // Check if the discussion_comments table exists
    const { data: tableExists, error: tableCheckError } = await supabase.rpc('exec_sql', {
      sql: `SELECT EXISTS (
        SELECT FROM pg_tables
        WHERE schemaname = 'public'
        AND tablename = 'discussion_comments'
      );`
    });

    if (tableCheckError) {
      console.error('Error checking if discussion_comments table exists:', tableCheckError);
      return NextResponse.json(
        { error: 'Error checking if forum tables exist' },
        { status: 500 }
      );
    }

    // If table doesn't exist, create it
    if (!tableExists || !tableExists.data || !tableExists.data[0] || !tableExists.data[0].exists) {
      console.log('Discussion comments table does not exist, creating...');

      const { data: createResult, error: createError } = await supabase.rpc('exec_sql', {
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
          { error: 'Failed to create forum tables: ' + createError.message },
          { status: 500 }
        );
      }

      console.log('Forum tables created successfully');
    }

    // Now insert the comment with better error handling
    try {
      const { data: result, error } = await supabase.rpc('exec_sql', {
        sql: `
          INSERT INTO public.discussion_comments (post_id, user_id, content)
          VALUES (${post_id}, 'anonymous', '${content.replace(/'/g, "''")}')
          RETURNING id, post_id, user_id, content, created_at;
        `
      });

      if (error) {
        console.error('Error creating comment with direct SQL:', error);
        return NextResponse.json(
          { error: `Failed to create comment: ${error.message}` },
          { status: 500 }
        );
      }

      console.log('Raw SQL insert result:', result);

      // Handle different possible formats of the result
      let createdComment = null;

      if (result && Array.isArray(result) && result.length > 0) {
        // Array with the first element being the created comment
        createdComment = result[0];
      } else if (result && typeof result === 'object') {
        // Direct object representing the comment
        createdComment = result;
      }

      if (!createdComment) {
        console.error('Comment created but returned unexpected format:', result);
      } else {
        console.log('Comment created successfully:', createdComment);
      }

      // Fetch all comments for this post to return
      const { data: allComments, error: fetchError } = await supabase.rpc('exec_sql', {
        sql: `SELECT id, post_id, user_id, content, created_at FROM public.discussion_comments WHERE post_id = ${post_id} ORDER BY created_at ASC;`
      });

      if (fetchError) {
        console.error('Error fetching comments after creation:', fetchError);
      } else {
        console.log('Comments after creation:', allComments);
      }

      // Fetch the post to return
      const { data: postResult, error: postError } = await supabase.rpc('exec_sql', {
        sql: `SELECT id, user_id, title, content, created_at, updated_at FROM public.discussion_posts WHERE id = ${post_id};`
      });

      let post = null;
      if (postResult && Array.isArray(postResult) && postResult.length > 0) {
        post = postResult[0];
      } else if (postResult && typeof postResult === 'object') {
        post = postResult;
      }

      return NextResponse.json({
        success: true,
        comment: createdComment,
        comments: allComments || [],
        post: post
      });
    } catch (sqlError) {
      console.error('SQL error in direct-create-comment API:', sqlError);
      return NextResponse.json(
        { error: `SQL error: ${sqlError.message}` },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Unexpected error in direct-create-comment API:', error);
    return NextResponse.json(
      { error: `Internal server error: ${error.message}` },
      { status: 500 }
    );
  }
}
