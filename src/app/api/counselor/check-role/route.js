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
      return NextResponse.json({ 
        success: false,
        error: 'No active session found',
        authenticated: false
      });
    }
    
    // Get user profile to check role
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('role, display_name')
      .eq('id', session.user.id)
      .single();
    
    if (profileError) {
      console.error('Error fetching profile:', profileError);
      
      // Try to create a profile if it doesn't exist
      if (profileError.code === 'PGRST116') {
        const displayName = session.user.user_metadata?.display_name || 
                           session.user.email?.split('@')[0] || 
                           'User';
        
        const { data: newProfile, error: createError } = await supabase
          .from('user_profiles')
          .insert({
            id: session.user.id,
            display_name: displayName,
            role: 'user',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();
        
        if (createError) {
          return NextResponse.json({
            success: false,
            error: 'Failed to create user profile',
            authenticated: true,
            userId: session.user.id,
            email: session.user.email,
            role: null
          });
        }
        
        return NextResponse.json({
          success: true,
          authenticated: true,
          userId: session.user.id,
          email: session.user.email,
          role: 'user',
          displayName: displayName,
          profile: newProfile
        });
      }
      
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch user profile',
        authenticated: true,
        userId: session.user.id,
        email: session.user.email,
        role: null
      });
    }
    
    return NextResponse.json({
      success: true,
      authenticated: true,
      userId: session.user.id,
      email: session.user.email,
      role: profile.role,
      displayName: profile.display_name,
      profile
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
