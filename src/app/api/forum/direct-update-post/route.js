import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic'; // This ensures the route is always dynamic

export async function POST(request) {
  try {
    // Get the post details from the request body
    const { postId, title, content } = await request.json();

    if (!postId || !title || !content) {
      return NextResponse.json(
        { error: 'Post ID, title, and content are required' },
        { status: 400 }
      );
    }

    // Initialize Supabase client
    const supabase = createRouteHandlerClient({ cookies });

    // Get the session if available
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

    // If table doesn't exist, return an error
    if (!tableExists || !tableExists.data || !tableExists.data[0] || !tableExists.data[0].exists) {
      console.error('Discussion posts table does not exist');
      return NextResponse.json(
        { error: 'Forum tables do not exist' },
        { status: 500 }
      );
    }

    // Update the post with better error handling
    try {
      const { data: result, error } = await supabase.rpc('exec_sql', {
        sql: `
          UPDATE public.discussion_posts
          SET title = '${title.replace(/'/g, "''")}', 
              content = '${content.replace(/'/g, "''")}',
              updated_at = NOW()
          WHERE id = ${postId}
          RETURNING id, user_id, title, content, created_at, updated_at;
        `
      });

      if (error) {
        console.error('Error updating post with direct SQL:', error);
        return NextResponse.json(
          { error: `Failed to update post: ${error.message}` },
          { status: 500 }
        );
      }

      console.log('Raw SQL update result:', result);
      
      // Handle different possible formats of the result
      let updatedPost = null;
      
      if (result && Array.isArray(result) && result.length > 0) {
        // Array with the first element being the updated post
        updatedPost = result[0];
      } else if (result && typeof result === 'object') {
        // Direct object representing the post
        updatedPost = result;
      }
      
      if (!updatedPost) {
        console.error('Post updated but returned unexpected format:', result);
        return NextResponse.json(
          { error: 'Post updated but returned unexpected format' },
          { status: 500 }
        );
      }

      console.log('Post updated successfully:', updatedPost);

      // Fetch comments for the post
      const { data: comments, error: commentsError } = await supabase.rpc('exec_sql', {
        sql: `SELECT id, post_id, user_id, content, created_at FROM public.discussion_comments WHERE post_id = ${postId} ORDER BY created_at ASC;`
      });

      if (commentsError) {
        console.error('Error fetching comments after update:', commentsError);
      }

      // Format the post with safe access to properties
      const formattedPost = {
        id: updatedPost.id || 0,
        user_id: updatedPost.user_id || 'anonymous',
        title: updatedPost.title || 'Untitled Post',
        content: updatedPost.content || 'No content',
        created_at: updatedPost.created_at || new Date().toISOString(),
        updated_at: updatedPost.updated_at || new Date().toISOString(),
        author_name: 'Anonymous',
        author_role: 'user'
      };

      // Format the comments with safe access to properties
      const formattedComments = comments ? comments.map(comment => ({
        id: comment.id || 0,
        post_id: comment.post_id || postId,
        user_id: comment.user_id || 'anonymous',
        content: comment.content || 'No comment',
        created_at: comment.created_at || new Date().toISOString(),
        author_name: 'Anonymous',
        author_role: 'user'
      })) : [];

      return NextResponse.json({ 
        success: true, 
        post: formattedPost,
        comments: formattedComments
      });
    } catch (sqlError) {
      console.error('SQL error in direct-update-post API:', sqlError);
      return NextResponse.json(
        { error: `SQL error: ${sqlError.message}` },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Unexpected error in direct-update-post API:', error);
    return NextResponse.json(
      { error: `Internal server error: ${error.message}` },
      { status: 500 }
    );
  }
}
