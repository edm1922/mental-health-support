import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Initialize Supabase client
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Error checking session:', sessionError);
      return NextResponse.json({
        success: false,
        error: sessionError.message,
        authenticated: false
      });
    }
    
    if (!session) {
      console.log('No session found');
      return NextResponse.json({
        success: false,
        error: 'No active session found',
        authenticated: false
      });
    }
    
    // Get user ID from session
    const userId = session.user.id;
    const userEmail = session.user.email;
    
    // Check user's role in user_profiles table
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('role, display_name')
      .eq('id', userId)
      .single();
    
    if (profileError) {
      console.error('Error fetching profile from user_profiles:', profileError);
      
      // Try to get role from user metadata
      const userRole = session.user.user_metadata?.role;
      
      return NextResponse.json({
        success: true,
        authenticated: true,
        userId,
        userEmail,
        profileError: profileError.message,
        userMetadataRole: userRole || 'none',
        message: 'Error fetching profile, but found role in user metadata'
      });
    }
    
    return NextResponse.json({
      success: true,
      authenticated: true,
      userId,
      userEmail,
      profile,
      userMetadataRole: session.user.user_metadata?.role || 'none',
      message: 'Successfully fetched user role'
    });
  } catch (error) {
    console.error('Error in check-role API:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
