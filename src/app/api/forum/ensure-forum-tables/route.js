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

    // Check if forum_posts table exists
    const { data: tableExists, error: tableCheckError } = await supabase.rpc('exec_sql', {
      sql: `SELECT EXISTS (
        SELECT FROM pg_tables
        WHERE schemaname = 'public'
        AND tablename = 'forum_posts'
      );`
    });

    if (tableCheckError) {
      console.error('Error checking if forum_posts table exists:', tableCheckError);
      return NextResponse.json(
        { error: 'Error checking if forum_posts table exists' },
        { status: 500 }
      );
    }

    // If table doesn't exist, create it
    if (!tableExists || !tableExists[0] || !tableExists[0].exists) {
      console.log('forum_posts table does not exist, creating it...');
      
      // Create forum_posts table
      const { error: createError } = await supabase.rpc('exec_sql', {
        sql: `
          -- Create forum_posts table for admin moderation
          CREATE TABLE public.forum_posts (
            id SERIAL PRIMARY KEY,
            user_id UUID,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            is_approved BOOLEAN DEFAULT FALSE,
            is_flagged BOOLEAN DEFAULT FALSE,
            is_pinned BOOLEAN DEFAULT FALSE,
            is_removed BOOLEAN DEFAULT FALSE,
            report_count INTEGER DEFAULT 0,
            approved_by UUID,
            approved_at TIMESTAMP WITH TIME ZONE,
            moderated_by UUID,
            moderated_at TIMESTAMP WITH TIME ZONE,
            pinned_by UUID,
            pinned_at TIMESTAMP WITH TIME ZONE,
            removed_by UUID,
            removed_at TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );

          -- Create forum_comments table for admin moderation
          CREATE TABLE public.forum_comments (
            id SERIAL PRIMARY KEY,
            post_id INTEGER REFERENCES public.forum_posts(id) ON DELETE CASCADE,
            user_id UUID,
            content TEXT NOT NULL,
            is_flagged BOOLEAN DEFAULT FALSE,
            is_removed BOOLEAN DEFAULT FALSE,
            report_count INTEGER DEFAULT 0,
            moderated_by UUID,
            moderated_at TIMESTAMP WITH TIME ZONE,
            removed_by UUID,
            removed_at TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );

          -- Create indexes
          CREATE INDEX IF NOT EXISTS forum_posts_user_id_idx ON public.forum_posts(user_id);
          CREATE INDEX IF NOT EXISTS forum_comments_user_id_idx ON public.forum_comments(user_id);
          CREATE INDEX IF NOT EXISTS forum_comments_post_id_idx ON public.forum_comments(post_id);

          -- Enable RLS
          ALTER TABLE public.forum_posts ENABLE ROW LEVEL SECURITY;
          ALTER TABLE public.forum_comments ENABLE ROW LEVEL SECURITY;

          -- Forum posts policies
          CREATE POLICY "Anyone can read forum posts"
            ON public.forum_posts FOR SELECT
            USING (true);

          CREATE POLICY "Anyone can create forum posts"
            ON public.forum_posts FOR INSERT
            WITH CHECK (true);

          CREATE POLICY "Users can update their own forum posts"
            ON public.forum_posts FOR UPDATE
            USING (auth.uid()::text = user_id::text);

          CREATE POLICY "Users can delete their own forum posts"
            ON public.forum_posts FOR DELETE
            USING (auth.uid()::text = user_id::text);

          -- Forum comments policies
          CREATE POLICY "Anyone can read forum comments"
            ON public.forum_comments FOR SELECT
            USING (true);

          CREATE POLICY "Anyone can create forum comments"
            ON public.forum_comments FOR INSERT
            WITH CHECK (true);

          CREATE POLICY "Users can update their own forum comments"
            ON public.forum_comments FOR UPDATE
            USING (auth.uid()::text = user_id::text);

          CREATE POLICY "Users can delete their own forum comments"
            ON public.forum_comments FOR DELETE
            USING (auth.uid()::text = user_id::text);
        `
      });

      if (createError) {
        console.error('Error creating forum tables:', createError);
        return NextResponse.json(
          { error: 'Failed to create forum tables: ' + createError.message },
          { status: 500 }
        );
      }

      // Create test post if the user is authenticated
      if (session?.user) {
        // Create a test forum post for moderation
        const { error: forumPostError } = await supabase
          .from('forum_posts')
          .insert({
            user_id: session.user.id,
            title: 'Welcome to the Forum Moderation',
            content: 'This is a test post to verify that the forum moderation is working correctly.',
            is_approved: false,
            is_flagged: true,
            report_count: 1
          });

        if (forumPostError) {
          console.error('Error creating test forum post:', forumPostError);
          return NextResponse.json({
            success: true,
            message: 'Forum tables created successfully, but failed to create test forum post',
            error: forumPostError.message
          });
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Forum tables created successfully'
      });
    }

    // Table exists, check if it has the required columns
    const requiredColumns = [
      'id', 'user_id', 'title', 'content', 'is_approved', 'is_flagged', 
      'is_pinned', 'is_removed', 'report_count', 'approved_by', 'approved_at',
      'moderated_by', 'moderated_at', 'pinned_by', 'pinned_at', 'removed_by',
      'removed_at', 'created_at', 'updated_at'
    ];

    // Check each column
    for (const column of requiredColumns) {
      const { data: columnExists, error: columnCheckError } = await supabase.rpc('exec_sql', {
        sql: `
          SELECT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'forum_posts' 
            AND column_name = '${column}'
          );
        `
      });

      if (columnCheckError) {
        console.error(`Error checking if column ${column} exists:`, columnCheckError);
        continue;
      }

      if (!columnExists || !columnExists[0] || !columnExists[0].exists) {
        console.log(`Column ${column} does not exist, adding it...`);
        
        // Add the missing column
        let dataType = 'TEXT';
        let defaultValue = '';
        
        if (column === 'id') {
          dataType = 'SERIAL PRIMARY KEY';
        } else if (column === 'user_id') {
          dataType = 'UUID';
        } else if (column === 'title' || column === 'content') {
          dataType = 'TEXT NOT NULL';
          defaultValue = "DEFAULT ''";
        } else if (column.startsWith('is_')) {
          dataType = 'BOOLEAN';
          defaultValue = 'DEFAULT FALSE';
        } else if (column === 'report_count') {
          dataType = 'INTEGER';
          defaultValue = 'DEFAULT 0';
        } else if (column.endsWith('_at')) {
          dataType = 'TIMESTAMP WITH TIME ZONE';
          if (column === 'created_at' || column === 'updated_at') {
            defaultValue = 'DEFAULT NOW()';
          }
        } else if (column.endsWith('_by')) {
          dataType = 'UUID';
        }

        // Skip id column as it can't be added if the table already exists
        if (column !== 'id') {
          const { error: addColumnError } = await supabase.rpc('exec_sql', {
            sql: `
              ALTER TABLE public.forum_posts 
              ADD COLUMN IF NOT EXISTS ${column} ${dataType} ${defaultValue};
            `
          });

          if (addColumnError) {
            console.error(`Error adding column ${column}:`, addColumnError);
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Forum tables verified and updated if needed'
    });
  } catch (error) {
    console.error('Unexpected error in ensure-forum-tables API:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}
