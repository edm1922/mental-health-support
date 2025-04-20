import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    // Initialize Supabase client
    const supabase = createRouteHandlerClient({ cookies });

    // Get the session if available
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get the post data from the request
    const { title, content } = await request.json();

    if (!title || !content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      );
    }

    console.log('Creating post with bypass-cache endpoint...');

    // First, try to refresh the schema cache
    try {
      await supabase.rpc('exec_sql', {
        sql: `
          -- This query forces Supabase to refresh its schema cache for the discussion_posts table
          SELECT id, title, content, user_id, is_approved, created_at, updated_at 
          FROM public.discussion_posts 
          LIMIT 1;
        `
      });
    } catch (refreshError) {
      console.log('Schema refresh attempt failed (expected):', refreshError.message);
      // Continue anyway
    }

    // Use direct SQL to insert the post, bypassing the schema cache
    try {
      const { data, error } = await supabase.rpc('exec_sql', {
        sql: `
          INSERT INTO public.discussion_posts (user_id, title, content, is_approved, created_at, updated_at)
          VALUES ('${session.user.id}', '${title.replace(/'/g, "''")}', '${content.replace(/'/g, "''")}', FALSE, NOW(), NOW())
          RETURNING id;
        `
      });

      if (error) {
        console.error('Error inserting post via SQL:', error);
        throw error;
      }

      console.log('Post created successfully via SQL:', data);
      return NextResponse.json({
        success: true,
        message: 'Post created successfully via SQL',
        post_id: data && data[0] ? data[0].id : null
      });
    } catch (sqlError) {
      console.error('Error inserting post via SQL:', sqlError);
      
      // Try a different approach - create the post without the is_approved column
      try {
        console.log('Trying to create post without is_approved column...');
        const { data, error } = await supabase.rpc('exec_sql', {
          sql: `
            INSERT INTO public.discussion_posts (user_id, title, content, created_at, updated_at)
            VALUES ('${session.user.id}', '${title.replace(/'/g, "''")}', '${content.replace(/'/g, "''")}', NOW(), NOW())
            RETURNING id;
          `
        });

        if (error) {
          console.error('Error inserting post without is_approved:', error);
          throw error;
        }

        // Now update the post to set is_approved to false
        const postId = data && data[0] ? data[0].id : null;
        if (postId) {
          try {
            await supabase.rpc('exec_sql', {
              sql: `
                UPDATE public.discussion_posts
                SET is_approved = FALSE
                WHERE id = ${postId};
              `
            });
          } catch (updateError) {
            console.error('Error updating is_approved (non-critical):', updateError);
            // Continue anyway
          }
        }

        console.log('Post created successfully via SQL (without is_approved):', data);
        return NextResponse.json({
          success: true,
          message: 'Post created successfully via SQL (without is_approved)',
          post_id: postId
        });
      } catch (fallbackError) {
        console.error('Error with fallback insert method:', fallbackError);
        return NextResponse.json(
          { error: 'Failed to create post: ' + fallbackError.message },
          { status: 500 }
        );
      }
    }
  } catch (error) {
    console.error('Unexpected error in create-post-bypass-cache API:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}
