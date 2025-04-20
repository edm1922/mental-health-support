import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic'; // This ensures the route is always dynamic

export async function POST(request) {
  try {
    // Get the comment data from the request body
    const { post_id, content } = await request.json();

    if (!post_id || !content) {
      return NextResponse.json(
        { error: 'Post ID and content are required' },
        { status: 400 }
      );
    }

    // Initialize Supabase client
    const supabase = createRouteHandlerClient({ cookies });

    // Verify the user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    console.log('Session in create-comment API:', session ? 'Session exists' : 'No session');

    // For development purposes, allow comments without authentication
    let userId = 'anonymous';

    if (session) {
      console.log('User ID from session:', session.user.id);
      userId = session.user.id;
    } else {
      console.log('No session found, using anonymous user ID');
    }

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

    // If table doesn't exist, try to initialize it by calling the posts endpoint
    if (!tableExists || !tableExists.data || !tableExists.data[0] || !tableExists.data[0].exists) {
      console.log('Discussion posts table does not exist, initializing...');

      // Call the posts endpoint to initialize the tables
      const initResponse = await fetch(new URL('/api/forum/posts', request.url).toString());

      if (!initResponse.ok) {
        return NextResponse.json(
          { error: 'Failed to initialize forum tables. Please try again.' },
          { status: 500 }
        );
      }

      console.log('Tables initialized successfully');
    }

    // Check if the post exists
    const { data: post, error: postError } = await supabase
      .from('discussion_posts')
      .select('id')
      .eq('id', post_id)
      .single();

    if (postError) {
      console.error('Error checking post existence:', postError);
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    console.log(`Creating comment for post ${post_id} by user ${userId}`);
    console.log('Comment content:', content);

    // Create the comment
    const { data: comment, error } = await supabase
      .from('discussion_comments')
      .insert({
        post_id,
        user_id: userId,
        content
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating comment:', error);
      return NextResponse.json(
        { error: `Failed to create comment: ${error.message}` },
        { status: 500 }
      );
    }

    console.log('Comment created successfully:', comment);

    return NextResponse.json({ comment });
  } catch (error) {
    console.error('Unexpected error in create-comment API:', error);
    return NextResponse.json(
      { error: `Internal server error: ${error.message}` },
      { status: 500 }
    );
  }
}
