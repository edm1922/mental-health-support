import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

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

    console.log('Updating post with ID:', postId);
    console.log('New title:', title);
    console.log('New content:', content);

    // Initialize Supabase client
    const supabase = createRouteHandlerClient({ cookies });

    // Update the post
    const { data: post, error } = await supabase
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
        { error: 'Failed to update post: ' + error.message },
        { status: 500 }
      );
    }

    console.log('Post updated successfully');

    return NextResponse.json({
      success: true,
      post
    });
  } catch (error) {
    console.error('Unexpected error in basic-update-post API:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}
