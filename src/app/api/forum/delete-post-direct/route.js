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

    // Require authentication
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // First, check if the post exists
    const { data: post, error: checkError } = await supabase
      .from('discussion_posts')
      .select('id')
      .eq('id', postId)
      .single();

    if (checkError) {
      console.error('Error checking if post exists:', checkError);
      return NextResponse.json(
        { error: 'Failed to check if post exists: ' + checkError.message },
        { status: 500 }
      );
    }

    if (!post) {
      console.error('Post not found:', postId);
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    // Delete the post (comments will be deleted automatically due to CASCADE)
    const { error: deleteError } = await supabase
      .from('discussion_posts')
      .delete()
      .eq('id', postId);

    if (deleteError) {
      console.error('Error deleting post:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete post: ' + deleteError.message },
        { status: 500 }
      );
    }

    console.log('Post deleted successfully:', postId);

    // Fetch all remaining posts with user profile information
    const { data: allPosts, error: fetchError } = await supabase
      .from('discussion_posts')
      .select(`
        *,
        user_profiles:user_id(display_name)
      `)
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('Error fetching posts after deletion:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch posts: ' + fetchError.message },
        { status: 500 }
      );
    }

    console.log('Posts after deletion:', allPosts);

    // Use the existing session from above
    console.log('Current session:', session ? 'User is authenticated' : 'No session');
    if (session?.user) {
      console.log('Authenticated user ID:', session.user.id);
    }

    // Format the posts with author information
    const formattedPosts = [];

    // Process each post and fetch user profile information
    if (allPosts && allPosts.length > 0) {
      for (const p of allPosts) {
        // Get the user's display name from user_profiles if available
        let displayName = 'Guest User';
        let authorRole = 'user';

        if (p.user_id) {
          // Try to get the user profile
          const { data: userProfile } = await supabase
            .from('user_profiles')
            .select('display_name, role')
            .eq('id', p.user_id)
            .single();

          if (userProfile && userProfile.display_name) {
            displayName = userProfile.display_name;
            authorRole = userProfile.role || 'user';
          } else {
            // If no profile found, try to get user metadata from auth
            try {
              // For the current user, we can use the session data
              if (session?.user && p.user_id === session.user.id) {
                displayName = session.user.user_metadata?.display_name ||
                              session.user.email?.split('@')[0] ||
                              'User';
              }
            } catch (err) {
              console.error('Error getting user metadata:', err);
            }
          }
        }

        formattedPosts.push({
          id: p.id || 0,
          user_id: p.user_id || 'anonymous',
          title: p.title || 'Untitled Post',
          content: p.content || 'No content',
          created_at: p.created_at || new Date().toISOString(),
          updated_at: p.updated_at || new Date().toISOString(),
          author_name: displayName,
          author_role: authorRole
        });
      }
    }

    return NextResponse.json({
      success: true,
      deletedPostId: postId,
      posts: formattedPosts
    });
  } catch (error) {
    console.error('Unexpected error in delete-post-direct API:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}
