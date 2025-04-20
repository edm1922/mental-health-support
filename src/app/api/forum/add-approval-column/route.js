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

    // Check if the column already exists
    const { data: columnCheck, error: columnCheckError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'discussion_posts' 
        AND column_name = 'is_approved';
      `
    });

    if (columnCheckError) {
      console.error('Error checking column existence:', columnCheckError);
      return NextResponse.json(
        { error: 'Failed to check column existence: ' + columnCheckError.message },
        { status: 500 }
      );
    }

    // If column already exists, return success
    if (columnCheck && columnCheck.length > 0) {
      return NextResponse.json({
        success: true,
        message: 'is_approved column already exists'
      });
    }

    // Add the is_approved column
    const { error } = await supabase.rpc('exec_sql', {
      sql: `
        -- Add is_approved column with default value of false
        ALTER TABLE public.discussion_posts 
        ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT FALSE;
        
        -- Add approved_by column
        ALTER TABLE public.discussion_posts 
        ADD COLUMN IF NOT EXISTS approved_by UUID;
        
        -- Add approved_at column
        ALTER TABLE public.discussion_posts 
        ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;
      `
    });

    if (error) {
      console.error('Error adding is_approved column:', error);
      return NextResponse.json(
        { error: 'Failed to add is_approved column: ' + error.message },
        { status: 500 }
      );
    }

    // Set existing posts to approved
    const { error: updateError } = await supabase.rpc('exec_sql', {
      sql: `
        -- Update existing posts to be approved
        UPDATE public.discussion_posts 
        SET is_approved = TRUE 
        WHERE is_approved IS NULL;
      `
    });

    if (updateError) {
      console.error('Error updating existing posts:', updateError);
      return NextResponse.json(
        { error: 'Failed to update existing posts: ' + updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'is_approved column added successfully'
    });
  } catch (error) {
    console.error('Unexpected error in add-approval-column API:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}
