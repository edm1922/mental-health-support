import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic'; // This ensures the route is always dynamic

export async function GET() {
  try {
    // Initialize Supabase client
    const supabase = createRouteHandlerClient({ cookies });

    // Get the session if available
    const { data: { session } } = await supabase.auth.getSession();
    console.log('Session:', session ? 'User is authenticated' : 'No session');

    // Log authentication status but don't require it
    if (!session?.user) {
      console.log('No user in session, proceeding as guest');
      // We'll still allow viewing posts, but not creating them
    } else {
      console.log('User authenticated:', session.user.id);
    }

    // Fetch posts using Supabase Data API
    const { data: posts, error } = await supabase
      .from('discussion_posts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching posts with Supabase Data API:', error);
      return NextResponse.json(
        { error: `Failed to fetch posts: ${error.message}` },
        { status: 500 }
      );
    }

    console.log('Supabase Data API result:', posts);

    // Format the posts with author information
    const formattedPosts = [];

    // Use the existing session from above
    console.log('Current session:', session ? 'User is authenticated' : 'No session');
    if (session?.user) {
      console.log('Authenticated user ID:', session.user.id);
    }

    // Process each post and fetch user profile information
    if (posts && posts.length > 0) {
      for (const post of posts) {
        // Get the user's display name from user_profiles if available
        let displayName = 'Guest User';
        let authorRole = 'user';

        if (post.user_id) {
          // Try to get the user profile
          const { data: userProfile } = await supabase
            .from('user_profiles')
            .select('display_name, role')
            .eq('id', post.user_id)
            .single();

          if (userProfile && userProfile.display_name) {
            displayName = userProfile.display_name;
            authorRole = userProfile.role || 'user';
          } else {
            // If no profile found, try to get user metadata from auth
            try {
              // For the current user, we can use the session data
              if (session?.user && post.user_id === session.user.id) {
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
          id: post.id || 0,
          user_id: post.user_id || 'anonymous',
          title: post.title || 'Untitled Post',
          content: post.content || 'No content',
          created_at: post.created_at || new Date().toISOString(),
          updated_at: post.updated_at || new Date().toISOString(),
          author_name: displayName,
          author_role: authorRole
        });
      }
    }

    return NextResponse.json({ posts: formattedPosts });
  } catch (error) {
    console.error('Unexpected error in posts-direct API:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}
