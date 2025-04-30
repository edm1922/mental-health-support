import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    // Get the request body
    const { userId } = await request.json();
    
    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        error: 'User ID is required' 
      }, { status: 400 });
    }
    
    // Initialize Supabase client
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      return NextResponse.json({ 
        success: false, 
        error: 'Authentication required' 
      }, { status: 401 });
    }
    
    // Update the user's role to counselor
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({ 
        role: 'counselor',
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);
    
    if (updateError) {
      console.error('Error updating user role:', updateError);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to update user role' 
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      message: 'User role updated to counselor successfully'
    });
  } catch (error) {
    console.error('Unexpected error in make-counselor API:', error);
    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred'
    }, { status: 500 });
  }
}
