import { NextResponse } from 'next/server';
import { supabase } from '@/utils/supabaseClient';

export const dynamic = 'force-dynamic'; // This ensures the route is always dynamic

export async function POST() {
  try {
    console.log('Updating database schema...');

    // Add the expanded JSONB column to user_profiles if it doesn't exist
    const { data: columnData, error: columnError } = await supabase.rpc('exec_sql', {
      sql: `
        DO $$
        BEGIN
          -- Check if the expanded column exists
          IF NOT EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name = 'user_profiles' 
            AND column_name = 'expanded'
          ) THEN
            -- Add the expanded column
            ALTER TABLE public.user_profiles 
            ADD COLUMN expanded JSONB DEFAULT '{}'::jsonb;
            
            RAISE NOTICE 'Added expanded column to user_profiles table';
          ELSE
            RAISE NOTICE 'expanded column already exists in user_profiles table';
          END IF;
        END
        $$;
      `
    });

    if (columnError) {
      console.error('Error adding expanded column:', columnError);
      return NextResponse.json({
        success: false,
        error: columnError.message,
        message: 'Failed to update schema'
      }, { status: 500 });
    }

    console.log('Schema updated successfully');
    return NextResponse.json({
      success: true,
      message: 'Schema updated successfully'
    });
  } catch (error) {
    console.error('Exception updating schema:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Unknown error',
      message: 'Failed to update schema'
    }, { status: 500 });
  }
}
