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
    console.log('Session in direct-post-view API:', session ? 'User is authenticated' : 'No session');

    // Use direct SQL to fetch the post and comments
    try {
      // First, check if the post exists with a simple query
      const { data: checkResult, error: checkError } = await supabase.rpc('exec_sql', {
        sql: `SELECT id FROM public.discussion_posts WHERE id = ${id};`
      });

      if (checkError) {
        console.error('Error checking post existence:', checkError);
        return NextResponse.json(
          { error: 'Failed to check post: ' + checkError.message },
          { status: 500 }
        );
      }

      // Check if post exists
      let postExists = false;
      if (checkResult && Array.isArray(checkResult) && checkResult.length > 0) {
        postExists = true;
      } else if (checkResult && typeof checkResult === 'object' && checkResult.id) {
        postExists = true;
      }

      if (!postExists) {
        console.error('Post not found');
        return NextResponse.json(
          { error: 'Post not found' },
          { status: 404 }
        );
      }

      // Fetch the post with author information
      let postResult;
      let postError;

      try {
        const result = await supabase.rpc('exec_sql', {
          sql: `
            SELECT
              p.id,
              p.user_id,
              p.title,
              p.content,
              p.created_at,
              p.updated_at,
              p.is_approved,
              up.display_name as author_name,
              up.role as author_role
            FROM
              public.discussion_posts p
            LEFT JOIN
              public.user_profiles up ON p.user_id = up.id
            WHERE
              p.id = ${id};
          `
        });

        postResult = result.data;
        postError = result.error;
      } catch (err) {
        postError = err;
      }

      if (postError) {
        console.error('Error fetching post with SQL:', postError);
        // Try a simpler query without the join
        try {
          const simpleResult = await supabase.rpc('exec_sql', {
            sql: `SELECT * FROM public.discussion_posts WHERE id = ${id};`
          });

          const simplePostResult = simpleResult.data;
          const simplePostError = simpleResult.error;

          if (simplePostError) {
            console.error('Error with simple post query:', simplePostError);
            return NextResponse.json(
              { error: 'Failed to fetch post: ' + simplePostError.message },
              { status: 500 }
            );
          }

          // Use the simple result
          if (simplePostResult && Array.isArray(simplePostResult) && simplePostResult.length > 0) {
            postResult = simplePostResult;
          } else if (simplePostResult && typeof simplePostResult === 'object') {
            postResult = [simplePostResult];
          } else {
            return NextResponse.json(
              { error: 'Post not found' },
              { status: 404 }
            );
          }
        } catch (simpleQueryError) {
          console.error('Error with simple post query:', simpleQueryError);
          return NextResponse.json(
            { error: 'Failed to fetch post: ' + simpleQueryError.message },
            { status: 500 }
          );
        }
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

      // Check if the post is approved or if the user is the author or an admin/counselor
      const isApproved = post.is_approved;
      const isAuthor = session?.user?.id === post.user_id;

      // Check if the user is an admin or counselor
      let isAdminOrCounselor = false;
      if (session?.user) {
        try {
          const { data: userProfile, error: profileError } = await supabase
            .from('user_profiles')
            .select('role')
            .eq('id', session.user.id)
            .single();

          if (!profileError && userProfile) {
            isAdminOrCounselor = userProfile.role === 'admin' || userProfile.role === 'counselor';
          }
        } catch (profileError) {
          console.error('Error checking user role:', profileError);
          // Continue anyway, assuming not admin/counselor
        }
      }

      // If the post is not approved and the user is not the author or an admin/counselor, return 403
      if (!isApproved && !isAuthor && !isAdminOrCounselor) {
        return NextResponse.json(
          { error: 'This post is awaiting approval and is not publicly viewable yet' },
          { status: 403 }
        );
      }

      // Fetch comments for the post with author names
      const { data: commentsResult, error: commentsError } = await supabase.rpc('exec_sql', {
        sql: `
          SELECT
            c.id,
            c.post_id,
            c.user_id,
            c.content,
            c.created_at,
            c.updated_at,
            up.display_name as author_name,
            up.role as author_role
          FROM
            public.discussion_comments c
          LEFT JOIN
            public.user_profiles up ON c.user_id = up.id
          WHERE
            c.post_id = ${id}
          ORDER BY
            c.created_at ASC;
        `
      });

      let comments = [];

      if (commentsError) {
        console.error('Error fetching comments with SQL:', commentsError);
        // Try a simpler query without the join
        try {
          const { data: simpleCommentsResult, error: simpleCommentsError } = await supabase.rpc('exec_sql', {
            sql: `SELECT * FROM public.discussion_comments WHERE post_id = ${id} ORDER BY created_at ASC;`
          });

          if (!simpleCommentsError) {
            if (simpleCommentsResult && Array.isArray(simpleCommentsResult)) {
              comments = simpleCommentsResult;
            } else if (simpleCommentsResult && typeof simpleCommentsResult === 'object') {
              comments = [simpleCommentsResult];
            }
          }
        } catch (simpleCommentsError) {
          console.error('Error with simple comments query:', simpleCommentsError);
          // Continue without comments
        }
      } else {
        // Handle different possible formats of the comments result
        if (commentsResult && Array.isArray(commentsResult)) {
          comments = commentsResult;
        } else if (commentsResult && Array.isArray(commentsResult.data)) {
          comments = commentsResult.data;
        } else if (commentsResult && typeof commentsResult === 'object') {
          comments = [commentsResult];
        }
      }

      console.log('Comments query result:', comments.length > 0 ? `${comments.length} comments found` : 'No comments found');

      // Format the post with safe access to properties
      const formattedPost = {
        id: post.id || 0,
        user_id: post.user_id || 'anonymous',
        title: post.title || 'Untitled Post',
        content: post.content || 'No content',
        created_at: post.created_at || new Date().toISOString(),
        updated_at: post.updated_at || new Date().toISOString(),
        author_name: post.author_name || (post.user_id ? `User ${post.user_id.substring(0, 6)}` : 'Anonymous'),
        author_role: post.author_role || 'user',
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
        author_name: comment.author_name || (comment.user_id ? `User ${comment.user_id.substring(0, 6)}` : 'Anonymous'),
        author_role: comment.author_role || 'user'
      }));

      console.log('Returning formatted post:', formattedPost.title);
      console.log('Returning formatted comments count:', formattedComments.length);

      return NextResponse.json({
        success: true,
        post: formattedPost,
        comments: formattedComments
      });
    } catch (sqlError) {
      console.error('SQL error in direct-post-view API:', sqlError);

      // Try a completely different approach as a last resort
      try {
        // Get the post directly from the table
        const { data: post, error: postError } = await supabase
          .from('discussion_posts')
          .select('*')
          .eq('id', id)
          .single();

        if (postError) {
          throw postError;
        }

        // Get comments directly from the table
        const { data: comments, error: commentsError } = await supabase
          .from('discussion_comments')
          .select('*')
          .eq('post_id', id)
          .order('created_at', { ascending: true });

        // Format the post with minimal information
        const formattedPost = {
          id: post.id || 0,
          user_id: post.user_id || 'anonymous',
          title: post.title || 'Untitled Post',
          content: post.content || 'No content',
          created_at: post.created_at || new Date().toISOString(),
          updated_at: post.updated_at || new Date().toISOString(),
          author_name: 'Anonymous',
          is_approved: post.is_approved !== undefined ? post.is_approved : true
        };

        // Format the comments with minimal information
        const formattedComments = (comments || []).map(comment => ({
          id: comment.id || 0,
          post_id: comment.post_id || id,
          user_id: comment.user_id || 'anonymous',
          content: comment.content || 'No comment',
          created_at: comment.created_at || new Date().toISOString(),
          updated_at: comment.updated_at || new Date().toISOString(),
          author_name: 'Anonymous'
        }));

        return NextResponse.json({
          success: true,
          post: formattedPost,
          comments: formattedComments
        });
      } catch (lastResortError) {
        console.error('Last resort approach failed:', lastResortError);
        return NextResponse.json(
          { error: 'Failed to retrieve post after multiple attempts' },
          { status: 500 }
        );
      }
    }
  } catch (error) {
    console.error('Unexpected error in direct-post-view API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
