import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic'; // This ensures the route is always dynamic

export async function POST(request) {
  try {
    // Get the post ID from the request body
    const { postId } = await request.json();

    if (!postId) {
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

    // Check if the discussion_posts table exists
    const { data: tableExists, error: tableCheckError } = await supabase.rpc('exec_sql', {
      sql: `SELECT EXISTS (
        SELECT FROM pg_tables
        WHERE schemaname = 'public'
        AND tablename = 'discussion_posts'
      );`
    });

    if (tableCheckError) {
      console.error('Error checking if discussion_posts table exists:', tableCheckError);
      return NextResponse.json(
        { error: 'Error checking if forum tables exist' },
        { status: 500 }
      );
    }

    // If table doesn't exist, return an error
    if (!tableExists || !tableExists.data || !tableExists.data[0] || !tableExists.data[0].exists) {
      console.error('Discussion posts table does not exist');
      return NextResponse.json(
        { error: 'Forum tables do not exist' },
        { status: 500 }
      );
    }

    // Delete the post with better error handling
    try {
      // First, fetch the post to make sure it exists
      const { data: postResult, error: postError } = await supabase.rpc('exec_sql', {
        sql: `SELECT id FROM public.discussion_posts WHERE id = ${postId};`
      });

      if (postError) {
        console.error('Error checking if post exists:', postError);
        return NextResponse.json(
          { error: `Failed to check if post exists: ${postError.message}` },
          { status: 500 }
        );
      }

      let postExists = false;
      if (postResult && Array.isArray(postResult) && postResult.length > 0) {
        postExists = true;
      } else if (postResult && typeof postResult === 'object' && postResult.id) {
        postExists = true;
      }

      if (!postExists) {
        console.error('Post not found:', postId);
        return NextResponse.json(
          { error: 'Post not found' },
          { status: 404 }
        );
      }

      // Delete the post (comments will be deleted automatically due to CASCADE)
      const { data: result, error } = await supabase.rpc('exec_sql', {
        sql: `DELETE FROM public.discussion_posts WHERE id = ${postId} RETURNING id;`
      });

      if (error) {
        console.error('Error deleting post with direct SQL:', error);
        return NextResponse.json(
          { error: `Failed to delete post: ${error.message}` },
          { status: 500 }
        );
      }

      console.log('Post deleted successfully:', result);

      // Fetch all remaining posts
      const { data: allPosts, error: fetchError } = await supabase.rpc('exec_sql', {
        sql: `SELECT id, user_id, title, content, created_at, updated_at FROM public.discussion_posts ORDER BY created_at DESC;`
      });

      if (fetchError) {
        console.error('Error fetching posts after deletion:', fetchError);
      }

      // Format the posts with safe access to properties
      const formattedPosts = allPosts ? allPosts.map(post => ({
        id: post.id || 0,
        user_id: post.user_id || 'anonymous',
        title: post.title || 'Untitled Post',
        content: post.content || 'No content',
        created_at: post.created_at || new Date().toISOString(),
        updated_at: post.updated_at || new Date().toISOString(),
        author_name: 'Anonymous',
        author_role: 'user'
      })) : [];

      return NextResponse.json({ 
        success: true, 
        deletedPostId: postId,
        posts: formattedPosts
      });
    } catch (sqlError) {
      console.error('SQL error in direct-delete-post API:', sqlError);
      return NextResponse.json(
        { error: `SQL error: ${sqlError.message}` },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Unexpected error in direct-delete-post API:', error);
    return NextResponse.json(
      { error: `Internal server error: ${error.message}` },
      { status: 500 }
    );
  }
}
