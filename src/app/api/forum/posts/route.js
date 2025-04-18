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

    // Fetch posts with author information
    const { data: posts, error } = await supabase
      .from('discussion_posts')
      .select(`
        *,
        user_profiles(id, display_name, role)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching posts:', error);
      return NextResponse.json(
        { error: 'Failed to fetch posts' },
        { status: 500 }
      );
    }

    // Format the posts to match the expected structure
    const formattedPosts = posts.map(post => ({
      ...post,
      author_name: post.user_profiles?.display_name || 'Anonymous',
      author_role: post.user_profiles?.role || 'user'
    }));

    return NextResponse.json({ posts: formattedPosts });
  } catch (error) {
    console.error('Unexpected error in posts API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
