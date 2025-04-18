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
    
    // Verify the user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if the post exists and belongs to the user
    const { data: post, error: postError } = await supabase
      .from('discussion_posts')
      .select('id, user_id')
      .eq('id', postId)
      .single();

    if (postError) {
      console.error('Error checking post existence:', postError);
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    // Check if the user is the author of the post
    if (post.user_id !== session.user.id) {
      return NextResponse.json(
        { error: 'You are not authorized to delete this post' },
        { status: 403 }
      );
    }

    // Delete the post's comments first
    const { error: commentsError } = await supabase
      .from('discussion_comments')
      .delete()
      .eq('post_id', postId);

    if (commentsError) {
      console.error('Error deleting comments:', commentsError);
      return NextResponse.json(
        { error: 'Failed to delete comments' },
        { status: 500 }
      );
    }

    // Delete the post
    const { error } = await supabase
      .from('discussion_posts')
      .delete()
      .eq('id', postId);

    if (error) {
      console.error('Error deleting post:', error);
      return NextResponse.json(
        { error: 'Failed to delete post' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unexpected error in delete-post API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
