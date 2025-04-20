import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

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

    // Get the session if available
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Insert the post directly
    const { data: post, error } = await supabase
      .from('discussion_posts')
      .insert({
        title,
        content,
        user_id: session.user.id
      })
      .select('*')
      .single();

    if (error) {
      console.error('Error creating post:', error);
      return NextResponse.json(
        { error: 'Failed to create post: ' + error.message },
        { status: 500 }
      );
    }

    // Get the user's display name
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('display_name')
      .eq('id', session.user.id)
      .single();

    const displayName = userProfile?.display_name || 
                      session.user.email?.split('@')[0] || 
                      'User';

    // Return the created post with author info
    return NextResponse.json({
      success: true,
      post: {
        ...post,
        author_name: displayName
      }
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}
