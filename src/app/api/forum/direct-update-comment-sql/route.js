import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic'; // This ensures the route is always dynamic

export async function POST(request) {
  try {
    // Get the comment details from the request body
    const { commentId, content, userId } = await request.json();

    if (!commentId || !content) {
      return NextResponse.json(
        { error: 'Comment ID and content are required' },
        { status: 400 }
      );
    }

    // Initialize Supabase client
    const supabase = createRouteHandlerClient({ cookies });

    // Get the session if available
    const { data: { session } } = await supabase.auth.getSession();
    console.log('Session in direct-update-comment-sql API:', session ? 'User is authenticated' : 'No session');

    // Check if the user is an admin or counselor
    let isAdminOrCounselor = false;
    let authenticatedUserId = null;

    if (session?.user) {
      authenticatedUserId = session.user.id;
      
      try {
        const { data: userProfile, error: profileError } = await supabase
          .from('user_profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();

        if (!profileError && userProfile) {
          isAdminOrCounselor = userProfile.role === 'admin' || userProfile.role === 'counselor';
          console.log(`User role: ${userProfile.role}, isAdminOrCounselor: ${isAdminOrCounselor}`);
        }
      } catch (profileError) {
        console.error('Error checking user role:', profileError);
        // Continue anyway, assuming not admin/counselor
      }
    }

    // First, check if the comment exists and get its current data
    try {
      const { data: commentResult, error: commentError } = await supabase.rpc('exec_sql', {
        sql: `SELECT id, user_id, post_id FROM public.discussion_comments WHERE id = ${commentId};`
      });

      if (commentError) {
        console.error('Error checking comment:', commentError);
        return NextResponse.json(
          { error: 'Failed to check comment: ' + commentError.message },
          { status: 500 }
        );
      }

      let comment = null;
      if (commentResult && Array.isArray(commentResult) && commentResult.length > 0) {
        comment = commentResult[0];
      } else if (commentResult && typeof commentResult === 'object') {
        comment = commentResult;
      }

      if (!comment) {
        console.error('Comment not found');
        return NextResponse.json(
          { error: 'Comment not found' },
          { status: 404 }
        );
      }

      // Check if the user is authorized to update this comment
      // Allow if:
      // 1. The user is the comment author, or
      // 2. The user is an admin or counselor
      const commentUserId = comment.user_id;
      const isAuthor = authenticatedUserId && authenticatedUserId === commentUserId;
      
      if (!isAuthor && !isAdminOrCounselor) {
        console.error('User not authorized to update this comment');
        return NextResponse.json(
          { error: 'You are not authorized to update this comment' },
          { status: 403 }
        );
      }

      // Get the post ID for returning later
      const postId = comment.post_id;

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

      // Get the author name for the comment
      let authorName = 'Anonymous';
      try {
        const { data: authorResult, error: authorError } = await supabase.rpc('exec_sql', {
          sql: `SELECT display_name FROM public.user_profiles WHERE id = '${updatedComment.user_id}';`
        });

        if (!authorError && authorResult) {
          if (Array.isArray(authorResult) && authorResult.length > 0) {
            authorName = authorResult[0].display_name || 'Anonymous';
          } else if (authorResult.display_name) {
            authorName = authorResult.display_name;
          }
        }
      } catch (authorError) {
        console.error('Error fetching author name:', authorError);
        // Continue with default author name
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
      console.error('SQL error in direct-update-comment-sql API:', sqlError);
      return NextResponse.json(
        { error: 'SQL error: ' + sqlError.message },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Unexpected error in direct-update-comment-sql API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
