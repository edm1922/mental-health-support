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
    console.log('Session in direct-post-view API:', session ? 'User is authenticated' : 'No session');

    // Use direct SQL to fetch the post and comments
    try {
      // Fetch the post
      const { data: postResult, error: postError } = await supabase.rpc('exec_sql', {
        sql: `
          SELECT 
            p.id, 
            p.user_id, 
            p.title, 
            p.content, 
            p.created_at, 
            p.updated_at, 
            p.is_approved,
            up.display_name as author_name
          FROM 
            public.discussion_posts p
          LEFT JOIN 
            public.user_profiles up ON p.user_id = up.id
          WHERE 
            p.id = ${id};
        `
      });

      if (postError) {
        console.error('Error fetching post with SQL:', postError);
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

      // Fetch comments for the post with author names
      const { data: commentsResult, error: commentsError } = await supabase.rpc('exec_sql', {
        sql: `
          SELECT 
            c.id, 
            c.post_id, 
            c.user_id, 
            c.content, 
            c.created_at, 
            c.updated_at,
            up.display_name as author_name
          FROM 
            public.discussion_comments c
          LEFT JOIN 
            public.user_profiles up ON c.user_id = up.id
          WHERE 
            c.post_id = ${id}
          ORDER BY 
            c.created_at ASC;
        `
      });

      if (commentsError) {
        console.error('Error fetching comments with SQL:', commentsError);
        // Continue without comments
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
        author_name: post.author_name || (post.user_id ? `User ${post.user_id.substring(0, 6)}` : 'Anonymous'),
        is_approved: post.is_approved !== undefined ? post.is_approved : true
      };

      // Format the comments with safe access to properties
      const formattedComments = comments.map(comment => ({
        id: comment.id || 0,
        post_id: comment.post_id || id,
        user_id: comment.user_id || 'anonymous',
        content: comment.content || 'No comment',
        created_at: comment.created_at || new Date().toISOString(),
        updated_at: comment.updated_at || new Date().toISOString(),
        author_name: comment.author_name || (comment.user_id ? `User ${comment.user_id.substring(0, 6)}` : 'Anonymous')
      }));

      console.log('Returning formatted post:', formattedPost);
      console.log('Returning formatted comments:', formattedComments);

      return NextResponse.json({
        post: formattedPost,
        comments: formattedComments
      });
    } catch (sqlError) {
      console.error('SQL error in direct-post-view API:', sqlError);
      return NextResponse.json(
        { error: 'SQL error: ' + sqlError.message },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Unexpected error in direct-post-view API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
