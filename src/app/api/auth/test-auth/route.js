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
        error: sessionError.message 
      });
    }
    
    if (!session) {
      return NextResponse.json({ 
        success: false, 
        message: 'No active session found' 
      });
    }
    
    // Get user details
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('Error getting user:', userError);
      return NextResponse.json({ 
        success: false, 
        error: userError.message 
      });
    }
    
    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();
      
    if (profileError && !profileError.message.includes('No rows found')) {
      console.error('Error getting profile:', profileError);
    }
    
    return NextResponse.json({
      success: true,
      message: 'Authentication successful',
      user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at
      },
      profile: profile || null,
      session: {
        expires_at: session.expires_at
      }
    });
  } catch (error) {
    console.error('Unexpected error in test-auth:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
