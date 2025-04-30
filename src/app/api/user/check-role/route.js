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
      console.log('No session found in check-role API');
      return NextResponse.json({
        success: false,
        error: 'No active session found',
        authenticated: false
      });
    }
    
    // Get user ID from session
    const userId = session.user.id;
    console.log('User ID from session:', userId);
    
    // Check user role
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('role, display_name')
      .eq('id', userId)
      .single();
    
    if (profileError) {
      console.error('Error fetching profile:', profileError);
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch user profile',
        authenticated: true
      });
    }
    
    console.log('User profile from check-role:', profile);
    
    return NextResponse.json({
      success: true,
      authenticated: true,
      userId,
      role: profile?.role || 'unknown',
      displayName: profile?.display_name || session.user.email.split('@')[0],
      email: session.user.email
    });
  } catch (error) {
    console.error('Unexpected error in check-role API:', error);
    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred',
      authenticated: false
    }, { status: 500 });
  }
}
