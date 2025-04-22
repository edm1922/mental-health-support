import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic'; // This ensures the route is always dynamic

export async function POST(request) {
  try {
    // Get the comment data from the request body
    const { commentId, content } = await request.json();
    
    if (!commentId || !content) {
      return NextResponse.json(
        { error: 'Comment ID and content are required' },
        { status: 400 }
      );
    }

    // Initialize Supabase client
    const supabase = createRouteHandlerClient({ cookies });
    
    // Verify the user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if the comment exists and belongs to the user
    const { data: comment, error: commentError } = await supabase
      .from('discussion_comments')
      .select('id, user_id, post_id')
      .eq('id', commentId)
      .single();

    if (commentError) {
      console.error('Error checking comment existence:', commentError);
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      );
    }

    // Check if the user is the author of the comment
    if (comment.user_id !== session.user.id) {
      return NextResponse.json(
        { error: 'You are not authorized to update this comment' },
        { status: 403 }
      );
    }

    // Update the comment
    const { data: updatedComment, error } = await supabase
      .from('discussion_comments')
      .update({
        content,
        updated_at: new Date().toISOString()
      })
      .eq('id', commentId)
      .select()
      .single();

    if (error) {
      console.error('Error updating comment:', error);
      return NextResponse.json(
        { error: 'Failed to update comment' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true,
      comment: updatedComment,
      postId: comment.post_id
    });
  } catch (error) {
    console.error('Unexpected error in update-comment API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
