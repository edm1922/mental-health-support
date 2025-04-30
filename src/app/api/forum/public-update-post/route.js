import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic'; // This ensures the route is always dynamic

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

    // Initialize Supabase client
    const supabase = createRouteHandlerClient({ cookies });

    // Get the session if available (not required for this test endpoint)
    const { data: { session } } = await supabase.auth.getSession();
    console.log('Session in public-update-post API:', session ? 'User is authenticated' : 'No session');

    // Note: This is a test endpoint that doesn't require authentication
    // In a production environment, you would want to require authentication

    // Update the post using direct SQL
    try {
      // Sanitize the input to prevent SQL injection
      const sanitizedTitle = title.replace(/'/g, "''");
      const sanitizedContent = content.replace(/'/g, "''");

      const { data: updateResult, error: updateError } = await supabase.rpc('exec_sql', {
        sql: `
          UPDATE public.discussion_posts
          SET title = '${sanitizedTitle}', 
              content = '${sanitizedContent}',
              updated_at = NOW()
          WHERE id = ${postId}
          RETURNING id, user_id, title, content, created_at, updated_at, is_approved;
        `
      });

      if (updateError) {
        console.error('Error updating post:', updateError);
        return NextResponse.json(
          { error: 'Failed to update post: ' + updateError.message },
          { status: 500 }
        );
      }

      console.log('Post updated successfully:', updateResult);

      // Get the updated post
      let updatedPost = null;
      if (updateResult && Array.isArray(updateResult) && updateResult.length > 0) {
        updatedPost = updateResult[0];
      } else if (updateResult && typeof updateResult === 'object') {
        updatedPost = updateResult;
      }

      if (!updatedPost) {
        return NextResponse.json(
          { error: 'Post not found or update failed' },
          { status: 404 }
        );
      }

      // Fetch comments for the post
      const { data: commentsResult, error: commentsError } = await supabase.rpc('exec_sql', {
        sql: `SELECT id, post_id, user_id, content, created_at, updated_at
              FROM public.discussion_comments
              WHERE post_id = ${postId}
              ORDER BY created_at ASC;`
      });

      if (commentsError) {
        console.error('Error fetching comments:', commentsError);
        // Continue without comments
      }

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
      const userIds = [updatedPost.user_id, ...comments.map(comment => comment.user_id)].filter(Boolean);
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
        id: updatedPost.id || 0,
        user_id: updatedPost.user_id || 'anonymous',
        title: updatedPost.title || 'Untitled Post',
        content: updatedPost.content || 'No content',
        created_at: updatedPost.created_at || new Date().toISOString(),
        updated_at: updatedPost.updated_at || new Date().toISOString(),
        author_name: updatedPost.user_id && userProfiles[updatedPost.user_id] ?
          userProfiles[updatedPost.user_id] :
          (updatedPost.user_id ? `User ${updatedPost.user_id.substring(0, 6)}` : 'Anonymous'),
        is_approved: updatedPost.is_approved !== undefined ? updatedPost.is_approved : true
      };

      // Format the comments with safe access to properties
      const formattedComments = comments.map(comment => ({
        id: comment.id || 0,
        post_id: comment.post_id || postId,
        user_id: comment.user_id || 'anonymous',
        content: comment.content || 'No comment',
        created_at: comment.created_at || new Date().toISOString(),
        updated_at: comment.updated_at || new Date().toISOString(),
        author_name: comment.user_id && userProfiles[comment.user_id] ?
          userProfiles[comment.user_id] :
          (comment.user_id ? `User ${comment.user_id.substring(0, 6)}` : 'Anonymous')
      }));

      return NextResponse.json({
        success: true,
        post: formattedPost,
        comments: formattedComments
      });
    } catch (sqlError) {
      console.error('SQL error in public-update-post API:', sqlError);
      return NextResponse.json(
        { error: 'SQL error: ' + sqlError.message },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Unexpected error in public-update-post API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
