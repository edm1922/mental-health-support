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

    // First, ensure the table exists
    try {
      await supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS public.discussion_posts (
            id SERIAL PRIMARY KEY,
            user_id UUID,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            is_approved BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `
      });
    } catch (tableError) {
      console.log('Error creating table (may already exist):', tableError);
      // Continue anyway, as the table might already exist
    }

    // Try to insert directly using SQL
    try {
      const { data, error } = await supabase.rpc('exec_sql', {
        sql: `
          INSERT INTO public.discussion_posts (user_id, title, content, is_approved)
          VALUES ('${session.user.id}', '${title.replace(/'/g, "''")}', '${content.replace(/'/g, "''")}', FALSE)
          RETURNING id;
        `
      });

      if (error) {
        throw error;
      }

      return NextResponse.json({
        success: true,
        message: 'Post created successfully via SQL',
        post_id: data && data[0] ? data[0].id : null
      });
    } catch (sqlError) {
      console.error('Error inserting post via SQL:', sqlError);
      
      // Fall back to regular insert
      try {
        const { data: post, error } = await supabase
          .from('discussion_posts')
          .insert({
            title,
            content,
            user_id: session.user.id,
            is_approved: false
          })
          .select()
          .single();

        if (error) {
          throw error;
        }

        return NextResponse.json({
          success: true,
          message: 'Post created successfully via API',
          post
        });
      } catch (apiError) {
        console.error('Error inserting post via API:', apiError);
        return NextResponse.json(
          { error: 'Failed to create post: ' + apiError.message },
          { status: 500 }
        );
      }
    }
  } catch (error) {
    console.error('Unexpected error in direct-post API:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}
