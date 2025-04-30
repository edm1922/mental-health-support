import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic'; // This ensures the route is always dynamic

export async function POST(request) {
  try {
    // Get the post ID and content from the request body
    const { post_id, content } = await request.json();

    if (!post_id || !content) {
      return NextResponse.json(
        { error: 'Post ID and content are required' },
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

    // Insert the comment using Supabase Data API
    const { data: comment, error } = await supabase
      .from('discussion_comments')
      .insert({
        post_id,
        user_id: session.user.id,
        content
      })
      .select('*')
      .single();

    if (error) {
      console.error('Error creating comment:', error);
      return NextResponse.json(
        { error: 'Failed to create comment: ' + error.message },
        { status: 500 }
      );
    }

    console.log('Comment created successfully:', comment);

    // Fetch all comments for this post
    const { data: comments, error: commentsError } = await supabase
      .from('discussion_comments')
      .select('*')
      .eq('post_id', post_id)
      .order('created_at', { ascending: true });

    if (commentsError) {
      console.error('Error fetching comments after creation:', commentsError);
      return NextResponse.json(
        { error: 'Failed to fetch comments: ' + commentsError.message },
        { status: 500 }
      );
    }

    console.log('Comments after creation:', comments);

    // Fetch the post
    const { data: post, error: postError } = await supabase
      .from('discussion_posts')
      .select('*')
      .eq('id', post_id)
      .single();

    if (postError) {
      console.error('Error fetching post after comment creation:', postError);
      return NextResponse.json(
        { error: 'Failed to fetch post: ' + postError.message },
        { status: 500 }
      );
    }

    console.log('Post after comment creation:', post);

    // Format the comment with author information
    // Get the user's display name from user_profiles if available
    let displayName = 'Guest User';

    if (comment.user_id) {
      // Try to get the user profile
      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('display_name')
        .eq('id', comment.user_id)
        .single();

      if (userProfile && userProfile.display_name) {
        displayName = userProfile.display_name;
      } else {
        // If no profile found, try to get user metadata from auth
        try {
          // For the current user, we can use the session data
          if (session?.user && comment.user_id === session.user.id) {
            displayName = session.user.user_metadata?.display_name ||
                          session.user.email?.split('@')[0] ||
                          'User';
          }
        } catch (err) {
          console.error('Error getting user metadata:', err);
        }
      }
    }

    const formattedComment = {
      id: comment.id || 0,
      post_id: comment.post_id || post_id,
      user_id: comment.user_id || 'anonymous',
      content: comment.content || 'No comment',
      created_at: comment.created_at || new Date().toISOString(),
      author_name: displayName,
      author_role: 'user'
    };

    // Format all comments with author information
    const formattedComments = [];

    // Process each comment and fetch user profile information
    if (comments && comments.length > 0) {
      for (const c of comments) {
        // Get the user's display name from user_profiles if available
        let commentDisplayName = 'Guest User';

        if (c.user_id) {
          // Try to get the user profile
          const { data: commentUserProfile } = await supabase
            .from('user_profiles')
            .select('display_name')
            .eq('id', c.user_id)
            .single();

          if (commentUserProfile && commentUserProfile.display_name) {
            commentDisplayName = commentUserProfile.display_name;
          } else {
            // If no profile found, try to get user metadata from auth
            try {
              // For the current user, we can use the session data
              if (session?.user && c.user_id === session.user.id) {
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
          id: c.id || 0,
          post_id: c.post_id || post_id,
          user_id: c.user_id || 'anonymous',
          content: c.content || 'No comment',
          created_at: c.created_at || new Date().toISOString(),
          author_name: commentDisplayName,
          author_role: 'user'
        });
      }
    }

    // Format the post with author information
    // Get the user's display name from user_profiles if available
    let postDisplayName = 'Guest User';

    if (post.user_id) {
      // Try to get the user profile
      const { data: postUserProfile } = await supabase
        .from('user_profiles')
        .select('display_name')
        .eq('id', post.user_id)
        .single();

      if (postUserProfile && postUserProfile.display_name) {
        postDisplayName = postUserProfile.display_name;
      } else {
        // If no profile found, try to get user metadata from auth
        try {
          // For the current user, we can use the session data
          if (session?.user && post.user_id === session.user.id) {
            postDisplayName = session.user.user_metadata?.display_name ||
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
      author_name: postDisplayName,
      author_role: 'user'
    };

    return NextResponse.json({
      success: true,
      comment: formattedComment,
      comments: formattedComments,
      post: formattedPost
    });
  } catch (error) {
    console.error('Unexpected error in comment-direct API:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}
