import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic'; // This ensures the route is always dynamic

export async function GET() {
  try {
    // Initialize Supabase client
    const supabase = createRouteHandlerClient({ cookies });
    
    console.log('Creating test post...');
    
    // Get a user ID to use (first admin or counselor)
    const { data: users, error: userError } = await supabase
      .from('user_profiles')
      .select('id, role')
      .in('role', ['admin', 'counselor'])
      .limit(1);
      
    if (userError || !users || users.length === 0) {
      console.error('Error finding admin/counselor user:', userError);
      return NextResponse.json(
        { error: 'No admin or counselor user found' },
        { status: 500 }
      );
    }
    
    const userId = users[0].id;
    console.log('Using user ID:', userId);

    // Create a test post
    const { data: post, error } = await supabase
      .from('discussion_posts')
      .insert({
        user_id: userId,
        title: 'Test Post for Counselors',
        content: 'This is a test post created automatically to verify the forum functionality for counselors.'
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating test post:', error);
      return NextResponse.json(
        { error: `Failed to create test post: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, post });
  } catch (error) {
    console.error('Unexpected error in create-test-post API:', error);
    return NextResponse.json(
      { error: `Internal server error: ${error.message}` },
      { status: 500 }
    );
  }
}
