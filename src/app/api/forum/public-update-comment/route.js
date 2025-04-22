import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic'; // This ensures the route is always dynamic

export async function POST(request) {
  try {
    // Get the comment details from the request body
    const { commentId, content } = await request.json();

    if (!commentId || !content) {
      return NextResponse.json(
        { error: 'Comment ID and content are required' },
        { status: 400 }
      );
    }

    // Initialize Supabase client
    const supabase = createRouteHandlerClient({ cookies });

    // Get the session if available (not required for this test endpoint)
    const { data: { session } } = await supabase.auth.getSession();
    console.log('Session in public-update-comment API:', session ? 'User is authenticated' : 'No session');

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

      // Sanitize the input to prevent SQL injection
      const sanitizedContent = content.replace(/'/g, "''");

      // Update the comment
      const { data: updateResult, error: updateError } = await supabase.rpc('exec_sql', {
        sql: `
          UPDATE public.discussion_comments
          SET content = '${sanitizedContent}',
              updated_at = NOW()
          WHERE id = ${commentId}
          RETURNING id, post_id, user_id, content, created_at, updated_at;
        `
      });

      if (updateError) {
        console.error('Error updating comment:', updateError);
        return NextResponse.json(
          { error: 'Failed to update comment: ' + updateError.message },
          { status: 500 }
        );
      }

      console.log('Comment updated successfully:', updateResult);

      // Get the updated comment
      let updatedComment = null;
      if (updateResult && Array.isArray(updateResult) && updateResult.length > 0) {
        updatedComment = updateResult[0];
      } else if (updateResult && typeof updateResult === 'object') {
        updatedComment = updateResult;
      }

      if (!updatedComment) {
        return NextResponse.json(
          { error: 'Comment not found or update failed' },
          { status: 404 }
        );
      }

      // Try to get user profile for the comment author
      let authorName = 'Anonymous';
      if (updatedComment.user_id) {
        try {
          const { data: profile, error: profileError } = await supabase
            .from('user_profiles')
            .select('display_name')
            .eq('id', updatedComment.user_id)
            .single();

          if (!profileError && profile) {
            authorName = profile.display_name;
          } else {
            authorName = `User ${updatedComment.user_id.substring(0, 6)}`;
          }
        } catch (profileError) {
          console.error('Error fetching user profile:', profileError);
          // Continue without profile
          authorName = `User ${updatedComment.user_id.substring(0, 6)}`;
        }
      }

      // Format the comment with safe access to properties
      const formattedComment = {
        id: updatedComment.id || 0,
        post_id: updatedComment.post_id || postId,
        user_id: updatedComment.user_id || 'anonymous',
        content: updatedComment.content || 'No comment',
        created_at: updatedComment.created_at || new Date().toISOString(),
        updated_at: updatedComment.updated_at || new Date().toISOString(),
        author_name: authorName
      };

      return NextResponse.json({
        success: true,
        comment: formattedComment,
        postId: postId
      });
    } catch (sqlError) {
      console.error('SQL error in public-update-comment API:', sqlError);
      return NextResponse.json(
        { error: 'SQL error: ' + sqlError.message },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Unexpected error in public-update-comment API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
