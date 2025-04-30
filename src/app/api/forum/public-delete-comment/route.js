import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic'; // This ensures the route is always dynamic

export async function POST(request) {
  try {
    // Get the comment ID from the request body
    const { commentId } = await request.json();

    if (!commentId) {
      return NextResponse.json(
        { error: 'Comment ID is required' },
        { status: 400 }
      );
    }

    // Initialize Supabase client
    const supabase = createRouteHandlerClient({ cookies });

    // Get the session if available (not required for this test endpoint)
    const { data: { session } } = await supabase.auth.getSession();
    console.log('Session in public-delete-comment API:', session ? 'User is authenticated' : 'No session');

    // Note: This is a test endpoint that doesn't require authentication
    // In a production environment, you would want to require authentication

    // First, get the post_id so we can return it
    try {
      const { data: commentResult, error: commentError } = await supabase.rpc('exec_sql', {
        sql: `SELECT post_id FROM public.discussion_comments WHERE id = ${commentId};`
      });

      if (commentError) {
        console.error('Error getting comment:', commentError);
        return NextResponse.json(
          { error: 'Failed to get comment: ' + commentError.message },
          { status: 500 }
        );
      }

      let postId = null;
      if (commentResult && Array.isArray(commentResult) && commentResult.length > 0) {
        postId = commentResult[0].post_id;
      } else if (commentResult && typeof commentResult === 'object' && commentResult.post_id) {
        postId = commentResult.post_id;
      }

      if (!postId) {
        console.error('Comment not found or post_id is null');
        return NextResponse.json(
          { error: 'Comment not found or post_id is null' },
          { status: 404 }
        );
      }

      // Now delete the comment
      const { data: deleteResult, error: deleteError } = await supabase.rpc('exec_sql', {
        sql: `DELETE FROM public.discussion_comments WHERE id = ${commentId} RETURNING id;`
      });

      if (deleteError) {
        console.error('Error deleting comment:', deleteError);
        return NextResponse.json(
          { error: 'Failed to delete comment: ' + deleteError.message },
          { status: 500 }
        );
      }

      console.log('Comment deleted successfully:', deleteResult);

      return NextResponse.json({
        success: true,
        message: 'Comment deleted successfully',
        postId: postId
      });
    } catch (sqlError) {
      console.error('SQL error in public-delete-comment API:', sqlError);
      return NextResponse.json(
        { error: 'SQL error: ' + sqlError.message },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Unexpected error in public-delete-comment API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
