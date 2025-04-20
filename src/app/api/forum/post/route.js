import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic'; // This ensures the route is always dynamic

export async function POST(request) {
  try {
    // Get the post ID from the request body
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'Post ID is required' },
        { status: 400 }
      );
    }

    // Initialize Supabase client
    const supabase = createRouteHandlerClient({ cookies });

    // Get the session if available (not required for viewing posts)
    const { data: { session } } = await supabase.auth.getSession();
    console.log('Session:', session ? 'User is authenticated' : 'No session');

    // Check if the discussion_posts table exists
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

    // If table doesn't exist, try to initialize it by calling the posts endpoint
    if (!tableExists || !tableExists.data || !tableExists.data[0] || !tableExists.data[0].exists) {
      console.log('Discussion posts table does not exist, initializing...');

      // Call the posts endpoint to initialize the tables
      const initResponse = await fetch(new URL('/api/forum/posts', request.url).toString());

      if (!initResponse.ok) {
        return NextResponse.json(
          { error: 'Failed to initialize forum tables. Please try again.' },
          { status: 500 }
        );
      }

      console.log('Tables initialized successfully');
    }

    // Fetch the post using direct SQL
    try {
      const { data: postResult, error: postError } = await supabase.rpc('exec_sql', {
        sql: `SELECT id, user_id, title, content, created_at, updated_at
              FROM public.discussion_posts
              WHERE id = ${id};`
      });

      if (postError) {
        console.error('Error fetching post:', postError);
        return NextResponse.json(
          { error: 'Failed to fetch post: ' + postError.message },
          { status: 500 }
        );
      }

      console.log('Post query result:', postResult);

      // Handle different possible formats of the result
      let post = null;

      if (postResult && Array.isArray(postResult) && postResult.length > 0) {
        post = postResult[0];
      } else if (postResult && typeof postResult === 'object') {
        post = postResult;
      }

      if (!post) {
        console.error('Post not found or invalid format:', postResult);
        return NextResponse.json(
          { error: 'Post not found or invalid format' },
          { status: 404 }
        );
      }

      // Fetch comments for the post using direct SQL
      const { data: commentsResult, error: commentsError } = await supabase.rpc('exec_sql', {
        sql: `SELECT id, post_id, user_id, content, created_at
              FROM public.discussion_comments
              WHERE post_id = ${id}
              ORDER BY created_at ASC;`
      });

      if (commentsError) {
        console.error('Error fetching comments:', commentsError);
        return NextResponse.json(
          { error: 'Failed to fetch comments: ' + commentsError.message },
          { status: 500 }
        );
      }

      console.log('Comments query result:', commentsResult);

      // Handle different possible formats of the comments result
      let comments = [];

      if (commentsResult && Array.isArray(commentsResult)) {
        comments = commentsResult;
      } else if (commentsResult && Array.isArray(commentsResult.data)) {
        comments = commentsResult.data;
      } else if (commentsResult && typeof commentsResult === 'object') {
        comments = [commentsResult];
      }

    // Format the post with safe access to properties
    const formattedPost = {
      id: post.id || 0,
      user_id: post.user_id || 'anonymous',
      title: post.title || 'Untitled Post',
      content: post.content || 'No content',
      created_at: post.created_at || new Date().toISOString(),
      updated_at: post.updated_at || new Date().toISOString(),
      author_name: 'Anonymous',
      author_role: 'user'
    };

    // Format the comments with safe access to properties
    const formattedComments = comments.map(comment => ({
      id: comment.id || 0,
      post_id: comment.post_id || id,
      user_id: comment.user_id || 'anonymous',
      content: comment.content || 'No comment',
      created_at: comment.created_at || new Date().toISOString(),
      author_name: 'Anonymous',
      author_role: 'user'
    }));

    console.log('Returning formatted post:', formattedPost);
    console.log('Returning formatted comments:', formattedComments);

    return NextResponse.json({
      post: formattedPost,
      comments: formattedComments
    });
  } catch (sqlError) {
    console.error('SQL error in post API:', sqlError);
    return NextResponse.json(
      { error: 'SQL error: ' + sqlError.message },
      { status: 500 }
    );
  }
  } catch (error) {
    console.error('Unexpected error in post API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
