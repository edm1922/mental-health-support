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

    // Get the session if available (not required for viewing posts)
    const { data: { session } } = await supabase.auth.getSession();
    console.log('Session in public-post API:', session ? 'User is authenticated' : 'No session');

    // Note: We don't require authentication for viewing posts
    // This is just to get the user info if available

    // Fetch the post using direct SQL
    try {
      const { data: postResult, error: postError } = await supabase.rpc('exec_sql', {
        sql: `SELECT id, user_id, title, content, created_at, updated_at, is_approved
              FROM public.discussion_posts
              WHERE id = ${id};`
      });

      if (postError) {
        console.error('Error fetching post:', postError);
        return NextResponse.json(
          { error: 'Failed to fetch post: ' + postError.message },
          { status: 500 }
        );
      }

      console.log('Post query result:', postResult);

      // Handle different possible formats of the result
      let post = null;

      if (postResult && Array.isArray(postResult) && postResult.length > 0) {
        post = postResult[0];
      } else if (postResult && typeof postResult === 'object') {
        post = postResult;
      }

      if (!post) {
        console.error('Post not found or invalid format:', postResult);
        return NextResponse.json(
          { error: 'Post not found or invalid format' },
          { status: 404 }
        );
      }

      // Fetch comments for the post using direct SQL
      const { data: commentsResult, error: commentsError } = await supabase.rpc('exec_sql', {
        sql: `SELECT id, post_id, user_id, content, created_at, updated_at
              FROM public.discussion_comments
              WHERE post_id = ${id}
              ORDER BY created_at ASC;`
      });

      if (commentsError) {
        console.error('Error fetching comments:', commentsError);
        return NextResponse.json(
          { error: 'Failed to fetch comments: ' + commentsError.message },
          { status: 500 }
        );
      }

      console.log('Comments query result:', commentsResult);

      // Handle different possible formats of the comments result
      let comments = [];

      if (commentsResult && Array.isArray(commentsResult)) {
        comments = commentsResult;
      } else if (commentsResult && Array.isArray(commentsResult.data)) {
        comments = commentsResult.data;
      } else if (commentsResult && typeof commentsResult === 'object') {
        comments = [commentsResult];
      }

      // Try to get user profiles for the post author and comment authors
      const userIds = [post.user_id, ...comments.map(comment => comment.user_id)].filter(Boolean);
      let userProfiles = {};

      if (userIds.length > 0) {
        try {
          const { data: profiles, error: profilesError } = await supabase
            .from('user_profiles')
            .select('id, display_name')
            .in('id', userIds);

          if (!profilesError && profiles) {
            // Create a map of user_id to display_name
            profiles.forEach(profile => {
              userProfiles[profile.id] = profile.display_name;
            });
          }
        } catch (profileError) {
          console.error('Error fetching user profiles:', profileError);
          // Continue without profiles
        }
      }

      // Format the post with safe access to properties
      const formattedPost = {
        id: post.id || 0,
        user_id: post.user_id || 'anonymous',
        title: post.title || 'Untitled Post',
        content: post.content || 'No content',
        created_at: post.created_at || new Date().toISOString(),
        updated_at: post.updated_at || new Date().toISOString(),
        author_name: post.user_id && userProfiles[post.user_id] ?
          userProfiles[post.user_id] :
          (post.user_id ? `User ${post.user_id.substring(0, 6)}` : 'Anonymous'),
        is_approved: post.is_approved !== undefined ? post.is_approved : true
      };

      // Format the comments with safe access to properties
      const formattedComments = comments.map(comment => ({
        id: comment.id || 0,
        post_id: comment.post_id || id,
        user_id: comment.user_id || 'anonymous',
        content: comment.content || 'No comment',
        created_at: comment.created_at || new Date().toISOString(),
        updated_at: comment.updated_at || new Date().toISOString(),
        author_name: comment.user_id && userProfiles[comment.user_id] ?
          userProfiles[comment.user_id] :
          (comment.user_id ? `User ${comment.user_id.substring(0, 6)}` : 'Anonymous')
      }));

      console.log('Returning formatted post:', formattedPost);
      console.log('Returning formatted comments:', formattedComments);

      return NextResponse.json({
        post: formattedPost,
        comments: formattedComments
      });
    } catch (sqlError) {
      console.error('SQL error in public-post API:', sqlError);
      return NextResponse.json(
        { error: 'SQL error: ' + sqlError.message },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Unexpected error in public-post API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
