import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    // Initialize Supabase client
    const supabase = createRouteHandlerClient({ cookies });

    // Get the session if available
    const { data: { session } } = await supabase.auth.getSession();
    console.log('Session:', session ? 'User is authenticated' : 'No session');

    // Check if the discussion_posts table exists
    const { error: checkError } = await supabase
      .from('discussion_posts')
      .select('id')
      .limit(1);

    // If the table doesn't exist, we'll return a message suggesting to run the SQL script
    if (checkError && checkError.message.includes('does not exist')) {
      console.log('Discussion posts table does not exist');
      return NextResponse.json({
        success: false,
        message: 'The discussion_posts table does not exist. Please run the SQL script in the Supabase SQL editor.'
      });
    }

    // Check if the is_approved column exists
    let hasApprovedColumn = false;
    try {
      const { error: columnCheckError } = await supabase
        .from('discussion_posts')
        .select('is_approved')
        .limit(1);

      hasApprovedColumn = !columnCheckError;
    } catch (err) {
      console.log('Error checking for is_approved column:', err);
    }

    // If the is_approved column doesn't exist, return a message
    if (!hasApprovedColumn) {
      console.log('is_approved column does not exist');
      return NextResponse.json({
        success: false,
        message: 'The is_approved column does not exist. Please run the SQL script in the Supabase SQL editor.'
      });
    }

    // Create a test post if the user is authenticated
    if (session?.user) {
      console.log('Creating test post...');

      const { error: createPostError } = await supabase
        .from('discussion_posts')
        .insert({
          title: 'Test Post',
          content: 'This is a test post to verify the forum is working.',
          user_id: session.user.id,
          is_approved: true
        });

      if (createPostError) {
        console.error('Error creating test post:', createPostError);
        // Continue anyway, as this is just a test post
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Schema check completed'
    });
  } catch (error) {
    console.error('Unexpected error in fix-schema-simple API:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}
