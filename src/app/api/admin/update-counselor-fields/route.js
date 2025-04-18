import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request) {
  try {
    // Initialize Supabase client
    const supabase = createRouteHandlerClient({ cookies });
    
    // Verify the user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if the user is an admin
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();
      
    if (profileError || userProfile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }
    
    // Add counselor-specific fields to the user_profiles table
    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: `
        -- Add counselor-specific fields to user_profiles table
        ALTER TABLE public.user_profiles 
          ADD COLUMN IF NOT EXISTS specializations TEXT[] DEFAULT '{}',
          ADD COLUMN IF NOT EXISTS years_experience INTEGER,
          ADD COLUMN IF NOT EXISTS credentials TEXT,
          ADD COLUMN IF NOT EXISTS availability_hours TEXT,
          ADD COLUMN IF NOT EXISTS professional_bio TEXT;
      `
    });
    
    if (alterError) {
      console.error('Error adding counselor fields:', alterError);
      return NextResponse.json(
        { error: 'Failed to add counselor fields to user_profiles table' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ 
      success: true,
      message: 'Counselor fields added to user_profiles table successfully' 
    });
  } catch (error) {
    console.error('Error updating counselor fields:', error);
    return NextResponse.json(
      { error: 'Failed to update counselor fields: ' + error.message },
      { status: 500 }
    );
  }
}
