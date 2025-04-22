import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic'; // This ensures the route is always dynamic

export async function POST(request) {
  try {
    // Get the post details from the request body
    const { postId, title, content, userId } = await request.json();

    if (!postId || !title || !content) {
      return NextResponse.json(
        { error: 'Post ID, title, and content are required' },
        { status: 400 }
      );
    }

    // Initialize Supabase client
    const supabase = createRouteHandlerClient({ cookies });

    // Get the session if available
    const { data: { session } } = await supabase.auth.getSession();
    console.log('Session in direct-update-post-sql API:', session ? 'User is authenticated' : 'No session');

    // Check if the user is an admin or counselor
    let isAdminOrCounselor = false;
    let authenticatedUserId = null;

    if (session?.user) {
      authenticatedUserId = session.user.id;
      
      try {
        const { data: userProfile, error: profileError } = await supabase
          .from('user_profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();

        if (!profileError && userProfile) {
          isAdminOrCounselor = userProfile.role === 'admin' || userProfile.role === 'counselor';
          console.log(`User role: ${userProfile.role}, isAdminOrCounselor: ${isAdminOrCounselor}`);
        }
      } catch (profileError) {
        console.error('Error checking user role:', profileError);
        // Continue anyway, assuming not admin/counselor
      }
    }

    // First, check if the post exists and get its current data
    try {
      const { data: postResult, error: postError } = await supabase.rpc('exec_sql', {
        sql: `SELECT id, user_id, is_approved FROM public.discussion_posts WHERE id = ${postId};`
      });

      if (postError) {
        console.error('Error checking post:', postError);
        return NextResponse.json(
          { error: 'Failed to check post: ' + postError.message },
          { status: 500 }
        );
      }

      let post = null;
      if (postResult && Array.isArray(postResult) && postResult.length > 0) {
        post = postResult[0];
      } else if (postResult && typeof postResult === 'object') {
        post = postResult;
      }

      if (!post) {
        console.error('Post not found');
        return NextResponse.json(
          { error: 'Post not found' },
          { status: 404 }
        );
      }

      // Check if the user is authorized to update this post
      // Allow if:
      // 1. The user is the post author, or
      // 2. The user is an admin or counselor
      const postUserId = post.user_id;
      const isAuthor = authenticatedUserId && authenticatedUserId === postUserId;
      
      if (!isAuthor && !isAdminOrCounselor) {
        console.error('User not authorized to update this post');
        return NextResponse.json(
          { error: 'You are not authorized to update this post' },
          { status: 403 }
        );
      }

      // Sanitize the input to prevent SQL injection
      const sanitizedTitle = title.replace(/'/g, "''");
      const sanitizedContent = content.replace(/'/g, "''");

      // Update the post
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
        sql: `
          SELECT c.id, c.post_id, c.user_id, c.content, c.created_at, c.updated_at, 
                 up.display_name as author_name
          FROM public.discussion_comments c
          LEFT JOIN public.user_profiles up ON c.user_id = up.id
          WHERE c.post_id = ${postId}
          ORDER BY c.created_at ASC;
        `
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

      // Get the author name for the post
      let authorName = 'Anonymous';
      try {
        const { data: authorResult, error: authorError } = await supabase.rpc('exec_sql', {
          sql: `SELECT display_name FROM public.user_profiles WHERE id = '${updatedPost.user_id}';`
        });

        if (!authorError && authorResult) {
          if (Array.isArray(authorResult) && authorResult.length > 0) {
            authorName = authorResult[0].display_name || 'Anonymous';
          } else if (authorResult.display_name) {
            authorName = authorResult.display_name;
          }
        }
      } catch (authorError) {
        console.error('Error fetching author name:', authorError);
        // Continue with default author name
      }

      // Format the post with safe access to properties
      const formattedPost = {
        id: updatedPost.id || 0,
        user_id: updatedPost.user_id || 'anonymous',
        title: updatedPost.title || 'Untitled Post',
        content: updatedPost.content || 'No content',
        created_at: updatedPost.created_at || new Date().toISOString(),
        updated_at: updatedPost.updated_at || new Date().toISOString(),
        author_name: authorName,
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
        author_name: comment.author_name || (comment.user_id ? `User ${comment.user_id.substring(0, 6)}` : 'Anonymous')
      }));

      return NextResponse.json({
        success: true,
        post: formattedPost,
        comments: formattedComments
      });
    } catch (sqlError) {
      console.error('SQL error in direct-update-post-sql API:', sqlError);
      return NextResponse.json(
        { error: 'SQL error: ' + sqlError.message },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Unexpected error in direct-update-post-sql API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
