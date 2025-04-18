import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic'; // This ensures the route is always dynamic

export async function POST() {
  try {
    // Initialize Supabase client
    const supabase = createRouteHandlerClient({ cookies });
    
    // Verify the user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Create a test post
    const { data: post, error } = await supabase
      .from('discussion_posts')
      .insert({
        user_id: session.user.id,
        title: 'Test Post',
        content: 'This is a test post created automatically to verify the forum functionality.'
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating test post:', error);
      return NextResponse.json(
        { error: 'Failed to create test post' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, post });
  } catch (error) {
    console.error('Unexpected error in test-post API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
