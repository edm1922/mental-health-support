import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic'; // This ensures the route is always dynamic

export async function GET(request, { params }) {
  try {
    const postId = params.id;
    
    if (!postId) {
      return NextResponse.json(
        { error: 'Post ID is required' },
        { status: 400 }
      );
    }
    
    // Initialize Supabase client
    const supabase = createRouteHandlerClient({ cookies });
    
    console.log(`Fetching post details for ID: ${postId}`);
    
    // Fetch the post
    const { data: post, error: postError } = await supabase
      .from('discussion_posts')
      .select('*')
      .eq('id', postId)
      .single();
      
    if (postError) {
      console.error('Error fetching post:', postError);
      return NextResponse.json(
        { error: `Failed to fetch post: ${postError.message}` },
        { status: 500 }
      );
    }
    
    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }
    
    // Fetch comments for the post
    const { data: comments, error: commentsError } = await supabase
      .from('discussion_comments')
      .select('*')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });
      
    if (commentsError) {
      console.error('Error fetching comments:', commentsError);
      // Continue with the post even if comments fail
    }
    
    // Format the post with default author information
    const formattedPost = {
      ...post,
      author_name: 'Anonymous',
      author_role: 'user',
      comments: comments || []
    };
    
    // Try to get author information if possible
    try {
      if (post.user_id) {
        const { data: author, error: authorError } = await supabase
          .from('user_profiles')
          .select('display_name, role')
          .eq('id', post.user_id)
          .single();
          
        if (!authorError && author) {
          formattedPost.author_name = author.display_name || 'Anonymous';
          formattedPost.author_role = author.role || 'user';
        }
      }
      
      // Try to get comment author information
      if (comments && comments.length > 0) {
        // Get unique user IDs from comments
        const userIds = [...new Set(comments.filter(c => c.user_id).map(c => c.user_id))];
        
        if (userIds.length > 0) {
          const { data: authors, error: authorsError } = await supabase
            .from('user_profiles')
            .select('id, display_name, role')
            .in('id', userIds);
            
          if (!authorsError && authors) {
            // Create a map of user IDs to author info
            const authorMap = {};
            authors.forEach(a => {
              authorMap[a.id] = {
                display_name: a.display_name,
                role: a.role
              };
            });
            
            // Update comments with author info
            formattedPost.comments = comments.map(comment => ({
              ...comment,
              author_name: comment.user_id && authorMap[comment.user_id] 
                ? authorMap[comment.user_id].display_name 
                : 'Anonymous',
              author_role: comment.user_id && authorMap[comment.user_id]
                ? authorMap[comment.user_id].role
                : 'user'
            }));
          }
        }
      }
    } catch (authorError) {
      console.error('Error fetching author information:', authorError);
      // Continue with default author info
    }
    
    return NextResponse.json({ post: formattedPost });
  } catch (error) {
    console.error('Unexpected error in post details API:', error);
    return NextResponse.json(
      { error: `Internal server error: ${error.message}` },
      { status: 500 }
    );
  }
}
