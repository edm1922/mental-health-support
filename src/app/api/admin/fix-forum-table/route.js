import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    // Initialize Supabase client
    const supabase = createRouteHandlerClient({ cookies });

    console.log('Fixing discussion_posts table...');

    // Simple, direct approach: recreate the table structure correctly
    const { error } = await supabase.rpc('exec_sql', {
      sql: `
        -- First, check if the table exists
        DO $$
        BEGIN
          -- If the table doesn't exist, create it
          IF NOT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'discussion_posts'
          ) THEN
            CREATE TABLE public.discussion_posts (
              id SERIAL PRIMARY KEY,
              user_id UUID,
              title TEXT NOT NULL,
              content TEXT NOT NULL,
              is_approved BOOLEAN DEFAULT FALSE,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
            
            -- Create an index on user_id
            CREATE INDEX IF NOT EXISTS discussion_posts_user_id_idx ON public.discussion_posts (user_id);
          ELSE
            -- If the table exists but is_approved column doesn't, add it
            IF NOT EXISTS (
              SELECT FROM information_schema.columns 
              WHERE table_schema = 'public' 
              AND table_name = 'discussion_posts' 
              AND column_name = 'is_approved'
            ) THEN
              ALTER TABLE public.discussion_posts ADD COLUMN is_approved BOOLEAN DEFAULT FALSE;
            END IF;
          END IF;
        END
        $$;
        
        -- Analyze the table to update statistics and force schema refresh
        ANALYZE public.discussion_posts;
      `
    });

    if (error) {
      console.error('Error fixing discussion_posts table:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Forum table fixed successfully'
    });
  } catch (error) {
    console.error('Unexpected error fixing forum table:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
