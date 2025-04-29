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

    // Execute SQL to fix the forum tables and policies
    const { error } = await supabase.rpc('exec_sql', {
      sql: `
        -- Drop existing tables
        DROP TABLE IF EXISTS public.discussion_comments;
        DROP TABLE IF EXISTS public.discussion_posts;
        
        -- Create discussion_posts table
        CREATE TABLE public.discussion_posts (
          id SERIAL PRIMARY KEY,
          user_id UUID,
          title TEXT NOT NULL,
          content TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Create discussion_comments table
        CREATE TABLE public.discussion_comments (
          id SERIAL PRIMARY KEY,
          post_id INTEGER REFERENCES public.discussion_posts(id) ON DELETE CASCADE,
          user_id UUID,
          content TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Create indexes
        CREATE INDEX IF NOT EXISTS discussion_posts_user_id_idx ON public.discussion_posts(user_id);
        CREATE INDEX IF NOT EXISTS discussion_comments_user_id_idx ON public.discussion_comments(user_id);
        CREATE INDEX IF NOT EXISTS discussion_comments_post_id_idx ON public.discussion_comments(post_id);
        
        -- Enable RLS
        ALTER TABLE public.discussion_posts ENABLE ROW LEVEL SECURITY;
        ALTER TABLE public.discussion_comments ENABLE ROW LEVEL SECURITY;
        
        -- Drop existing policies
        DROP POLICY IF EXISTS "Anyone can read posts" ON public.discussion_posts;
        DROP POLICY IF EXISTS "Authenticated users can create posts" ON public.discussion_posts;
        DROP POLICY IF EXISTS "Users can update their own posts" ON public.discussion_posts;
        DROP POLICY IF EXISTS "Users can delete their own posts" ON public.discussion_posts;
        
        DROP POLICY IF EXISTS "Anyone can read comments" ON public.discussion_comments;
        DROP POLICY IF EXISTS "Authenticated users can create comments" ON public.discussion_comments;
        DROP POLICY IF EXISTS "Users can update their own comments" ON public.discussion_comments;
        DROP POLICY IF EXISTS "Users can delete their own comments" ON public.discussion_comments;
        
        -- Create simplified policies
        -- Allow anyone to read posts
        CREATE POLICY "Anyone can read posts" 
          ON public.discussion_posts FOR SELECT 
          USING (true);
        
        -- Allow anyone to insert posts (we'll handle auth in the API)
        CREATE POLICY "Anyone can create posts" 
          ON public.discussion_posts FOR INSERT 
          WITH CHECK (true);
        
        -- Allow users to update their own posts
        CREATE POLICY "Users can update their own posts" 
          ON public.discussion_posts FOR UPDATE 
          USING (auth.uid() = user_id);
        
        -- Allow users to delete their own posts
        CREATE POLICY "Users can delete their own posts" 
          ON public.discussion_posts FOR DELETE 
          USING (auth.uid() = user_id);
        
        -- Allow anyone to read comments
        CREATE POLICY "Anyone can read comments" 
          ON public.discussion_comments FOR SELECT 
          USING (true);
        
        -- Allow anyone to insert comments (we'll handle auth in the API)
        CREATE POLICY "Anyone can create comments" 
          ON public.discussion_comments FOR INSERT 
          WITH CHECK (true);
        
        -- Allow users to update their own comments
        CREATE POLICY "Users can update their own comments" 
          ON public.discussion_comments FOR UPDATE 
          USING (auth.uid() = user_id);
        
        -- Allow users to delete their own comments
        CREATE POLICY "Users can delete their own comments" 
          ON public.discussion_comments FOR DELETE 
          USING (auth.uid() = user_id);
        
        -- Create a test post if the user is authenticated
        ${session?.user ? `
        INSERT INTO public.discussion_posts (user_id, title, content)
        VALUES ('${session.user.id}', 'Welcome to the Community Forum', 'This is a test post to verify that the forum is working correctly.');
        ` : ''}
      `
    });

    if (error) {
      console.error('Error fixing forum:', error);
      return NextResponse.json(
        { error: 'Failed to fix forum: ' + error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Forum fixed successfully'
    });
  } catch (error) {
    console.error('Unexpected error in fix-forum API:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}
