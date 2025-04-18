import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic'; // This ensures the route is always dynamic

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
    
    // Verify the user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Fetch the post with author information
    const { data: post, error: postError } = await supabase
      .from('discussion_posts')
      .select(`
        *,
        author:user_profiles!discussion_posts_user_id_fkey(id, display_name, role)
      `)
      .eq('id', id)
      .single();

    if (postError) {
      console.error('Error fetching post:', postError);
      return NextResponse.json(
        { error: 'Failed to fetch post' },
        { status: 500 }
      );
    }

    // Fetch comments for the post
    const { data: comments, error: commentsError } = await supabase
      .from('discussion_comments')
      .select(`
        *,
        author:user_profiles!discussion_comments_user_id_fkey(id, display_name, role)
      `)
      .eq('post_id', id)
      .order('created_at', { ascending: true });

    if (commentsError) {
      console.error('Error fetching comments:', commentsError);
      return NextResponse.json(
        { error: 'Failed to fetch comments' },
        { status: 500 }
      );
    }

    // Format the post and comments to match the expected structure
    const formattedPost = {
      ...post,
      author_name: post.author?.display_name || 'Anonymous'
    };

    const formattedComments = comments.map(comment => ({
      ...comment,
      author_name: comment.author?.display_name || 'Anonymous'
    }));

    return NextResponse.json({
      post: formattedPost,
      comments: formattedComments
    });
  } catch (error) {
    console.error('Unexpected error in post API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
