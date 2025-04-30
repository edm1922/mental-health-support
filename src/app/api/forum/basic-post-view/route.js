import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

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

    console.log('Fetching post with ID:', id);

    // Get the post directly using the Supabase client
    const { data: post, error: postError } = await supabase
      .from('discussion_posts')
      .select('*')
      .eq('id', id)
      .single();

    if (postError) {
      console.error('Error fetching post:', postError);
      return NextResponse.json(
        { error: 'Failed to fetch post: ' + postError.message },
        { status: 500 }
      );
    }

    console.log('Post found:', post.title);

    // Get comments directly using the Supabase client
    const { data: comments, error: commentsError } = await supabase
      .from('discussion_comments')
      .select('*')
      .eq('post_id', id)
      .order('created_at', { ascending: true });

    if (commentsError) {
      console.error('Error fetching comments:', commentsError);
      // Continue without comments
    }

    console.log('Comments found:', comments ? comments.length : 0);

    // Return the post and comments
    return NextResponse.json({
      success: true,
      post,
      comments: comments || []
    });
  } catch (error) {
    console.error('Unexpected error in basic-post-view API:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}
