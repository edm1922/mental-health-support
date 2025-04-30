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

    // Get the user's profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();
      
    if (profileError) {
      return NextResponse.json(
        { error: 'Failed to fetch profile', details: profileError.message },
        { status: 500 }
      );
    }
    
    // Check if the user is a counselor
    const isCounselor = profile?.role === 'counselor';
    
    if (isCounselor) {
      // Ensure counselor fields exist
      const { error: alterError } = await supabase.rpc('exec_sql', {
        sql: `
          -- Add counselor-specific fields to user_profiles table if they don't exist
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
        // Continue anyway, as the fields might already exist
      }
      
      // Return the profile with a flag indicating it's a counselor
      return NextResponse.json({
        profile,
        isCounselor: true,
        shouldShowMentalHealthFields: false
      });
    }
    
    // For non-counselors, return the profile with a flag to show mental health fields
    return NextResponse.json({
      profile,
      isCounselor: false,
      shouldShowMentalHealthFields: true
    });
  } catch (error) {
    console.error('Error updating profile view:', error);
    return NextResponse.json(
      { error: 'Failed to update profile view: ' + error.message },
      { status: 500 }
    );
  }
}
