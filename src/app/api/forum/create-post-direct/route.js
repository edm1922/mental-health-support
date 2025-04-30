import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic'; // This ensures the route is always dynamic

export async function POST(request) {
  try {
    // Get the post data from the request body
    const { title, content, user_id: requestUserId } = await request.json();

    if (!title || !content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      );
    }

    console.log('Received user_id in request:', requestUserId);

    // Initialize Supabase client
    const supabase = createRouteHandlerClient({ cookies });

    // Get the session if available
    const { data: { session } } = await supabase.auth.getSession();
    console.log('Session:', session ? 'User is authenticated' : 'No session');
    console.log('Session details:', JSON.stringify(session, null, 2));

    // Require authentication
    if (!session?.user) {
      console.log('No user in session, authentication required');
      return NextResponse.json(
        { error: 'Failed to create post: Please sign in to access the community forum.', redirectTo: '/account/signin?callbackUrl=/community' },
        { status: 401 }
      );
    }

    // Use the user ID from the request if provided, otherwise use the session user ID
    // This ensures we're using the same ID that was used to authenticate the request
    const userId = requestUserId || session.user.id;
    console.log('Using user ID for post:', userId);

    // Only log user details if we have a session
    if (session?.user) {
      console.log('Authenticated user ID:', session.user.id);
      console.log('User email:', session.user.email);
      console.log('User metadata:', JSON.stringify(session.user.user_metadata, null, 2));
    }

    // Insert the post using the Supabase Data API
    // Log the session information for debugging
    console.log('Session user:', session?.user);

    // Make sure the user has a profile
    try {
      // Check if the user profile exists - user_id is a UUID
      const { data: userProfile, error: profileCheckError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId) // UUID type
        .single();

      if (profileCheckError && profileCheckError.code !== 'PGRST116') { // PGRST116 is the error code for 'not found'
        console.error('Error checking user profile:', profileCheckError);
      }

      // If the user profile doesn't exist, create it
      if (!userProfile) {
        const displayName = session.user.user_metadata?.display_name ||
                          session.user.email?.split('@')[0] ||
                          'User';

        const { error: createProfileError } = await supabase
          .from('user_profiles')
          .insert({
            id: userId, // UUID type
            display_name: displayName,
            bio: '',
            role: 'user',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (createProfileError) {
          console.error('Error creating user profile:', createProfileError);
        } else {
          console.log('User profile created successfully for:', userId);
        }
      } else {
        console.log('User profile already exists for:', userId);
      }
    } catch (profileError) {
      console.error('Error handling user profile:', profileError);
      // Continue anyway, as this is not critical
    }

    // Always use the session user ID for security
    const { data: post, error } = await supabase
      .from('discussion_posts')
      .insert({
        user_id: session.user.id, // Always use the authenticated user's ID
        title,
        content
      })
      .select('*')
      .single();

    if (error) {
      console.error('Error creating post:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      return NextResponse.json(
        { error: 'Failed to create post: ' + error.message, details: error },
        { status: 500 }
      );
    }

    console.log('Post created successfully:', post);

    // Fetch all posts to return with user profile information
    const { data: allPosts, error: fetchError } = await supabase
      .from('discussion_posts')
      .select(`
        *,
        user_profiles:user_id(display_name)
      `)
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('Error fetching posts after creation:', fetchError);
    } else {
      console.log('Posts after creation:', allPosts);
    }

    // Format the post with author information
    // Get the user's display name from user_profiles if available
    let displayName = 'Guest User';

    if (post.user_id) {
      // Try to get the user profile
      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('display_name')
        .eq('id', post.user_id)
        .single();

      if (userProfile && userProfile.display_name) {
        displayName = userProfile.display_name;
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

    const formattedPost = {
      ...post,
      author_name: displayName,
      author_role: 'user'
    };

    // Format all posts with author information
    const formattedPosts = [];

    // Process each post and fetch user profile information
    if (allPosts && allPosts.length > 0) {
      for (const p of allPosts) {
        // Get the user's display name from user_profiles if available
        let postDisplayName = 'Guest User';
        let authorRole = 'user';

        if (p.user_id) {
          // Try to get the user profile
          const { data: postUserProfile } = await supabase
            .from('user_profiles')
            .select('display_name, role')
            .eq('id', p.user_id)
            .single();

          if (postUserProfile && postUserProfile.display_name) {
            postDisplayName = postUserProfile.display_name;
            authorRole = postUserProfile.role || 'user';
          } else {
            // If no profile found, try to get user metadata from auth
            try {
              // For the current user, we can use the session data
              if (session?.user && p.user_id === session.user.id) {
                postDisplayName = session.user.user_metadata?.display_name ||
                                  session.user.email?.split('@')[0] ||
                                  'User';
              }
            } catch (err) {
              console.error('Error getting user metadata:', err);
            }
          }
        }

        formattedPosts.push({
          ...p,
          author_name: postDisplayName,
          author_role: authorRole
        });
      }
    }

    return NextResponse.json({
      success: true,
      post: formattedPost,
      allPosts: formattedPosts
    });
  } catch (error) {
    console.error('Unexpected error in create-post-direct API:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}
