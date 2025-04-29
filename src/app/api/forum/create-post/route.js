import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic'; // This ensures the route is always dynamic

export async function POST(request) {
  try {
    // Get the post data from the request body
    const { title, content } = await request.json();

    if (!title || !content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      );
    }

    // Initialize Supabase client
    const supabase = createRouteHandlerClient({ cookies });

    // Verify the user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    console.log('Session in create-post API:', session ? 'Session exists' : 'No session');

    // For development purposes, allow posts without authentication
    let userId = 'anonymous';

    if (session) {
      console.log('User ID from session:', session.user.id);
      userId = session.user.id;
    } else {
      console.log('No session found, using anonymous user ID');
    }

    // Check if discussion_posts table exists
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

    console.log(`Creating post "${title}" by user ${userId}`);

    // Create the post
    console.log('Inserting post with data:', { user_id: userId, title, content });

    let post;
    try {
      const { data: createdPost, error } = await supabase
        .from('discussion_posts')
        .insert({
          user_id: userId,
          title,
          content,
          is_approved: false // Set to false by default, requiring admin approval
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating post:', error);
        return NextResponse.json(
          { error: `Failed to create post: ${error.message}`, details: error },
          { status: 500 }
        );
      }

      post = createdPost;
      console.log('Post created successfully:', post);

      // Double-check that the post was created using direct SQL
      const { data: sqlCheck, error: sqlError } = await supabase.rpc('exec_sql', {
        sql: `SELECT * FROM public.discussion_posts ORDER BY created_at DESC LIMIT 5;`
      });

      console.log('SQL check for posts:', sqlCheck, sqlError);

      // Also check using the API
      const { data: checkPost, error: checkError } = await supabase
        .from('discussion_posts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      console.log('API check for posts:', checkPost, checkError);

      return NextResponse.json({ post });
    } catch (insertError) {
      console.error('Exception during post creation:', insertError);
      return NextResponse.json(
        { error: `Exception during post creation: ${insertError.message}` },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Unexpected error in create-post API:', error);
    return NextResponse.json(
      { error: `Internal server error: ${error.message}` },
      { status: 500 }
    );
  }
}
