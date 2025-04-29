import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic'; // This ensures the route is always dynamic

export async function POST() {
  try {
    // Initialize Supabase client
    const supabase = createRouteHandlerClient({ cookies });
    
    console.log('Dropping forum tables...');
    
    // Drop the discussion_comments table first (because it has a foreign key to discussion_posts)
    const { error: dropCommentsError } = await supabase.rpc('exec_sql', {
      sql: `
        DROP TABLE IF EXISTS public.discussion_comments;
      `
    });
    
    if (dropCommentsError) {
      console.error('Error dropping discussion_comments table:', dropCommentsError);
      return NextResponse.json(
        { error: `Failed to drop discussion_comments table: ${dropCommentsError.message}` },
        { status: 500 }
      );
    }
    
    // Now drop the discussion_posts table
    const { error: dropPostsError } = await supabase.rpc('exec_sql', {
      sql: `
        DROP TABLE IF EXISTS public.discussion_posts;
      `
    });
    
    if (dropPostsError) {
      console.error('Error dropping discussion_posts table:', dropPostsError);
      return NextResponse.json(
        { error: `Failed to drop discussion_posts table: ${dropPostsError.message}` },
        { status: 500 }
      );
    }
    
    console.log('Forum tables dropped successfully');
    
    return NextResponse.json({ success: true, message: 'Forum tables dropped successfully' });
  } catch (error) {
    console.error('Unexpected error in drop-tables API:', error);
    return NextResponse.json(
      { error: `Internal server error: ${error.message}` },
      { status: 500 }
    );
  }
}
