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

    // Get the post directly from the table
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

    // Get comments directly from the table
    const { data: comments, error: commentsError } = await supabase
      .from('discussion_comments')
      .select('*')
      .eq('post_id', id)
      .order('created_at', { ascending: true });

    if (commentsError) {
      console.error('Error fetching comments:', commentsError);
      // Continue without comments
    }

    // Format the post with minimal information
    const formattedPost = {
      id: post.id,
      user_id: post.user_id,
      title: post.title,
      content: post.content,
      created_at: post.created_at,
      updated_at: post.updated_at,
      author_name: 'Anonymous',
      is_approved: post.is_approved
    };

    // Format the comments with minimal information
    const formattedComments = (comments || []).map(comment => ({
      id: comment.id,
      post_id: comment.post_id,
      user_id: comment.user_id,
      content: comment.content,
      created_at: comment.created_at,
      updated_at: comment.updated_at,
      author_name: 'Anonymous'
    }));

    return NextResponse.json({
      success: true,
      post: formattedPost,
      comments: formattedComments
    });
  } catch (error) {
    console.error('Unexpected error in simple-post-view API:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}
