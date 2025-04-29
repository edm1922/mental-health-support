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

    // Get the session if available
    const { data: { session } } = await supabase.auth.getSession();
    console.log('Session:', session ? 'User is authenticated' : 'No session');

    // Require authentication
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Fetch the post using Supabase Data API
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

    console.log('Post query result:', post);

    if (!post) {
      console.error('Post not found:', id);
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    // Fetch comments for the post using Supabase Data API
    const { data: comments, error: commentsError } = await supabase
      .from('discussion_comments')
      .select('*')
      .eq('post_id', id)
      .order('created_at', { ascending: true });

    if (commentsError) {
      console.error('Error fetching comments:', commentsError);
      return NextResponse.json(
        { error: 'Failed to fetch comments: ' + commentsError.message },
        { status: 500 }
      );
    }

    console.log('Comments query result:', comments);

    // Use the existing session from above
    console.log('Current session:', session ? 'User is authenticated' : 'No session');
    if (session?.user) {
      console.log('Authenticated user ID:', session.user.id);
    }

    // Format the post with author information
    // Get the user's display name from user_profiles if available
    let displayName = 'Guest User';
    let authorRole = 'user';

    if (post.user_id) {
      // Try to get the user profile
      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('display_name, role')
        .eq('id', post.user_id)
        .single();

      if (userProfile && userProfile.display_name) {
        displayName = userProfile.display_name;
        authorRole = userProfile.role || 'user';
      } else {
        // If no profile found, try to get user metadata from auth
        try {
          // For the current user, we can use the session data
          if (session?.user && post.user_id === session.user.id) {
            displayName = session.user.user_metadata?.display_name ||
                          session.user.email?.split('@')[0] ||
                          'User';
          }
        } catch (err) {
          console.error('Error getting user metadata:', err);
        }
      }
    }

    const formattedPost = {
      id: post.id || 0,
      user_id: post.user_id || 'anonymous',
      title: post.title || 'Untitled Post',
      content: post.content || 'No content',
      created_at: post.created_at || new Date().toISOString(),
      updated_at: post.updated_at || new Date().toISOString(),
      author_name: displayName,
      author_role: authorRole
    };

    // Format the comments with author information
    const formattedComments = [];

    // Process each comment and fetch user profile information
    if (comments && comments.length > 0) {
      for (const comment of comments) {
        // Get the user's display name from user_profiles if available
        let commentDisplayName = 'Guest User';
        let commentAuthorRole = 'user';

        if (comment.user_id) {
          // Try to get the user profile
          const { data: commentUserProfile } = await supabase
            .from('user_profiles')
            .select('display_name, role')
            .eq('id', comment.user_id)
            .single();

          if (commentUserProfile && commentUserProfile.display_name) {
            commentDisplayName = commentUserProfile.display_name;
            commentAuthorRole = commentUserProfile.role || 'user';
          } else {
            // If no profile found, try to get user metadata from auth
            try {
              // For the current user, we can use the session data
              if (session?.user && comment.user_id === session.user.id) {
                commentDisplayName = session.user.user_metadata?.display_name ||
                                     session.user.email?.split('@')[0] ||
                                     'User';
              }
            } catch (err) {
              console.error('Error getting user metadata:', err);
            }
          }
        }

        formattedComments.push({
          id: comment.id || 0,
          post_id: comment.post_id || id,
          user_id: comment.user_id || 'anonymous',
          content: comment.content || 'No comment',
          created_at: comment.created_at || new Date().toISOString(),
          author_name: commentDisplayName,
          author_role: commentAuthorRole
        });
      }
    }

    console.log('Returning formatted post:', formattedPost);
    console.log('Returning formatted comments:', formattedComments);

    return NextResponse.json({
      post: formattedPost,
      comments: formattedComments
    });
  } catch (error) {
    console.error('Unexpected error in post-direct API:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}
