import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    // Get request body
    const { availability } = await request.json();
    
    if (availability === undefined) {
      return NextResponse.json({ 
        success: false, 
        error: 'Availability is required' 
      }, { status: 400 });
    }
    
    // Initialize Supabase client
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Get the current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      return NextResponse.json({ 
        success: false, 
        error: 'Authentication required' 
      }, { status: 401 });
    }
    
    const userId = session.user.id;
    
    // First, check if the user is a counselor
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', userId)
      .single();
    
    if (profileError) {
      console.error('Error fetching profile:', profileError);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to fetch user profile' 
      }, { status: 500 });
    }
    
    if (profile.role !== 'counselor') {
      return NextResponse.json({ 
        success: false, 
        error: 'Only counselors can update availability' 
      }, { status: 403 });
    }
    
    // Update the availability
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({
        availability_hours: availability,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);
    
    if (updateError) {
      console.error('Error updating availability:', updateError);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to update availability' 
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Availability updated successfully'
    });
  } catch (error) {
    console.error('Unexpected error in update-availability API:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'An unexpected error occurred' 
    }, { status: 500 });
  }
}
