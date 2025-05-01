import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

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
        isAdmin: false
      });
    }
    
    if (!session) {
      return NextResponse.json({ 
        success: false,
        error: 'No active session found',
        isAdmin: false
      });
    }
    
    // Get user profile to check role
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();
    
    if (profileError) {
      console.error('Error fetching profile:', profileError);
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch user profile',
        isAdmin: false
      });
    }
    
    const isAdmin = profile?.role === 'admin';
    
    return NextResponse.json({
      success: true,
      isAdmin,
      role: profile?.role || 'user',
      userId: session.user.id
    });
  } catch (error) {
    console.error('Unexpected error in check-role API:', error);
    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred',
      isAdmin: false
    }, { status: 500 });
  }
}
