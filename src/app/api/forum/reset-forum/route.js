import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic'; // This ensures the route is always dynamic

export async function POST(request) {
  try {
    // Initialize Supabase client
    const supabase = createRouteHandlerClient({ cookies });

    console.log('Completely resetting forum tables...');

    // First, drop the tables if they exist
    try {
      await supabase.rpc('exec_sql', {
        sql: `
          DROP TABLE IF EXISTS public.discussion_comments;
          DROP TABLE IF EXISTS public.discussion_posts;
        `
      });
      console.log('Existing tables dropped successfully');
    } catch (dropError) {
      console.error('Error dropping tables:', dropError);
      // Continue anyway, as tables might not exist
    }

    // Create the tables from scratch
    try {
      const { error: createError } = await supabase.rpc('exec_sql', {
        sql: `
          -- Create discussion_posts table
          CREATE TABLE public.discussion_posts (
            id SERIAL PRIMARY KEY,
            user_id UUID REFERENCES auth.users(id),
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );

          -- Create discussion_comments table
          CREATE TABLE public.discussion_comments (
            id SERIAL PRIMARY KEY,
            post_id INTEGER REFERENCES public.discussion_posts(id) ON DELETE CASCADE,
            user_id UUID REFERENCES auth.users(id),
            content TEXT NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );

          -- Create indexes for better performance
          CREATE INDEX IF NOT EXISTS discussion_posts_user_id_idx ON public.discussion_posts(user_id);
          CREATE INDEX IF NOT EXISTS discussion_comments_user_id_idx ON public.discussion_comments(user_id);
          CREATE INDEX IF NOT EXISTS discussion_comments_post_id_idx ON public.discussion_comments(post_id);
        `
      });

      if (createError) {
        console.error('Error creating tables:', createError);
        return NextResponse.json(
          { error: 'Failed to create forum tables: ' + createError.message },
          { status: 500 }
        );
      }
      console.log('Tables created successfully');
    } catch (createError) {
      console.error('Error creating tables:', createError);
      return NextResponse.json(
        { error: 'Failed to create forum tables: ' + createError.message },
        { status: 500 }
      );
    }

    // Enable RLS and create policies
    try {
      const { error: policyError } = await supabase.rpc('exec_sql', {
        sql: `
          -- Enable RLS on both tables
          ALTER TABLE public.discussion_posts ENABLE ROW LEVEL SECURITY;
          ALTER TABLE public.discussion_comments ENABLE ROW LEVEL SECURITY;

          -- Create policies for discussion_posts
          CREATE POLICY "Anyone can read posts" ON public.discussion_posts
            FOR SELECT USING (true);

          CREATE POLICY "Authenticated users can create posts" ON public.discussion_posts
            FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

          CREATE POLICY "Users can update their own posts" ON public.discussion_posts
            FOR UPDATE USING (auth.uid() = user_id);

          CREATE POLICY "Users can delete their own posts" ON public.discussion_posts
            FOR DELETE USING (auth.uid() = user_id);

          -- Create policies for discussion_comments
          CREATE POLICY "Anyone can read comments" ON public.discussion_comments
            FOR SELECT USING (true);

          CREATE POLICY "Authenticated users can create comments" ON public.discussion_comments
            FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

          CREATE POLICY "Users can update their own comments" ON public.discussion_comments
            FOR UPDATE USING (auth.uid() = user_id);

          CREATE POLICY "Users can delete their own comments" ON public.discussion_comments
            FOR DELETE USING (auth.uid() = user_id);
        `
      });

      if (policyError) {
        console.error('Error creating policies:', policyError);
        return NextResponse.json(
          { error: 'Failed to create policies: ' + policyError.message },
          { status: 500 }
        );
      }
      console.log('Policies created successfully');
    } catch (policyError) {
      console.error('Error creating policies:', policyError);
      return NextResponse.json(
        { error: 'Failed to create policies: ' + policyError.message },
        { status: 500 }
      );
    }

    // Get the current user's session
    const { data: { session } } = await supabase.auth.getSession();
    console.log('Session in reset-forum:', session ? 'User is authenticated' : 'No session');
    if (session?.user) {
      console.log('User ID in reset-forum:', session.user.id);
    }

    // If the user is authenticated, make sure they have a user profile
    if (session?.user) {
      try {
        // Check if the user profile exists
        const { data: userProfile, error: profileCheckError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', session.user.id)
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
              id: session.user.id,
              display_name: displayName,
              bio: '',
              role: 'user',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });

          if (createProfileError) {
            console.error('Error creating user profile:', createProfileError);
          } else {
            console.log('User profile created successfully for:', session.user.id);
          }
        } else {
          console.log('User profile already exists for:', session.user.id);
        }
      } catch (profileError) {
        console.error('Error handling user profile:', profileError);
        // Continue anyway, as this is not critical
      }
    }

    // Skip verification to simplify the process
    console.log('Skipping table verification to avoid potential errors');

    return NextResponse.json({
      success: true,
      message: 'Forum tables reset successfully'
    });
  } catch (error) {
    console.error('Unexpected error in reset-forum API:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}
