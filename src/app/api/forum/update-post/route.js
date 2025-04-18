import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic'; // This ensures the route is always dynamic

export async function POST(request) {
  try {
    // Get the post data from the request body
    const { postId, title, content } = await request.json();
    
    if (!postId || !title || !content) {
      return NextResponse.json(
        { error: 'Post ID, title, and content are required' },
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
        { error: 'You are not authorized to update this post' },
        { status: 403 }
      );
    }

    // Update the post
    const { data: updatedPost, error } = await supabase
      .from('discussion_posts')
      .update({
        title,
        content,
        updated_at: new Date().toISOString()
      })
      .eq('id', postId)
      .select()
      .single();

    if (error) {
      console.error('Error updating post:', error);
      return NextResponse.json(
        { error: 'Failed to update post' },
        { status: 500 }
      );
    }

    return NextResponse.json({ post: updatedPost });
  } catch (error) {
    console.error('Unexpected error in update-post API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
