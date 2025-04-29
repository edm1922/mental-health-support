import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic'; // This ensures the route is always dynamic

export async function POST(request) {
  try {
    // Get the post ID from the request body
    const { postId } = await request.json();

    if (!postId) {
      return NextResponse.json(
        { error: 'Post ID is required' },
        { status: 400 }
      );
    }

    // Initialize Supabase client
    const supabase = createRouteHandlerClient({ cookies });

    // Get the session if available (not required for this test endpoint)
    const { data: { session } } = await supabase.auth.getSession();
    console.log('Session in public-delete-post API:', session ? 'User is authenticated' : 'No session');

    // Note: This is a test endpoint that doesn't require authentication
    // In a production environment, you would want to require authentication

    // Delete the post using direct SQL
    try {
      // First, delete any comments associated with the post
      const { data: deleteCommentsResult, error: deleteCommentsError } = await supabase.rpc('exec_sql', {
        sql: `DELETE FROM public.discussion_comments WHERE post_id = ${postId};`
      });

      if (deleteCommentsError) {
        console.error('Error deleting comments:', deleteCommentsError);
        // Continue anyway, as the post might not have any comments
      } else {
        console.log('Comments deleted successfully');
      }

      // Now delete the post
      const { data: deletePostResult, error: deletePostError } = await supabase.rpc('exec_sql', {
        sql: `DELETE FROM public.discussion_posts WHERE id = ${postId} RETURNING id;`
      });

      if (deletePostError) {
        console.error('Error deleting post:', deletePostError);
        return NextResponse.json(
          { error: 'Failed to delete post: ' + deletePostError.message },
          { status: 500 }
        );
      }

      console.log('Post deleted successfully:', deletePostResult);

      return NextResponse.json({
        success: true,
        message: 'Post deleted successfully'
      });
    } catch (sqlError) {
      console.error('SQL error in public-delete-post API:', sqlError);
      return NextResponse.json(
        { error: 'SQL error: ' + sqlError.message },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Unexpected error in public-delete-post API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
