import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic'; // This ensures the route is always dynamic

export async function POST(request) {
  try {
    // Initialize Supabase client
    const supabase = createRouteHandlerClient({ cookies });

    // Get the session if available
    const { data: { session } } = await supabase.auth.getSession();
    console.log('Session:', session ? 'User is authenticated' : 'No session');

    // Drop and recreate the tables
    const { data: result, error } = await supabase.rpc('exec_sql', {
      sql: `
        -- Drop tables if they exist
        DROP TABLE IF EXISTS public.discussion_comments;
        DROP TABLE IF EXISTS public.discussion_posts;
        
        -- Create discussion_posts table
        CREATE TABLE public.discussion_posts (
          id SERIAL PRIMARY KEY,
          user_id TEXT NOT NULL,
          title TEXT NOT NULL,
          content TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Create discussion_comments table
        CREATE TABLE public.discussion_comments (
          id SERIAL PRIMARY KEY,
          post_id INTEGER REFERENCES public.discussion_posts(id) ON DELETE CASCADE,
          user_id TEXT NOT NULL,
          content TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Enable RLS on both tables
        ALTER TABLE public.discussion_posts ENABLE ROW LEVEL SECURITY;
        ALTER TABLE public.discussion_comments ENABLE ROW LEVEL SECURITY;
        
        -- Create policies for discussion_posts
        CREATE POLICY "Anyone can read posts" ON public.discussion_posts FOR SELECT USING (true);
        CREATE POLICY "Anyone can create posts" ON public.discussion_posts FOR INSERT WITH CHECK (true);
        CREATE POLICY "Anyone can update posts" ON public.discussion_posts FOR UPDATE USING (true);
        CREATE POLICY "Anyone can delete posts" ON public.discussion_posts FOR DELETE USING (true);
        
        -- Create policies for discussion_comments
        CREATE POLICY "Anyone can read comments" ON public.discussion_comments FOR SELECT USING (true);
        CREATE POLICY "Anyone can create comments" ON public.discussion_comments FOR INSERT WITH CHECK (true);
        CREATE POLICY "Anyone can update comments" ON public.discussion_comments FOR UPDATE USING (true);
        CREATE POLICY "Anyone can delete comments" ON public.discussion_comments FOR DELETE USING (true);
      `
    });

    if (error) {
      console.error('Error resetting forum tables:', error);
      return NextResponse.json(
        { error: 'Failed to reset forum tables: ' + error.message },
        { status: 500 }
      );
    }

    console.log('Forum tables reset successfully');

    return NextResponse.json({ 
      success: true, 
      message: 'Forum tables reset successfully'
    });
  } catch (error) {
    console.error('Unexpected error in reset-tables API:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}
