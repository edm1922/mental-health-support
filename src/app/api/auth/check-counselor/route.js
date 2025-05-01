import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Initialize Supabase client
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    console.log('Check counselor API called');
    
    // Get the current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      return NextResponse.json({
        success: false,
        error: `Session error: ${sessionError.message}`,
        authenticated: false
      });
    }
    
    if (!session) {
      return NextResponse.json({
        success: false,
        error: 'No active session',
        authenticated: false
      });
    }
    
    // Get the user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('role, display_name')
      .eq('id', session.user.id)
      .single();
    
    if (profileError) {
      // If profile doesn't exist, create one for the counselor email
      if (profileError.code === 'PGRST116' && session.user.email === 'counselor1@example.com') {
        const displayName = session.user.user_metadata?.display_name || 
                           session.user.email?.split('@')[0] || 
                           'Counselor';
        
        const { data: newProfile, error: createError } = await supabase
          .from('user_profiles')
          .upsert({
            id: session.user.id,
            display_name: displayName,
            role: 'counselor',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();
        
        if (createError) {
          return NextResponse.json({
            success: false,
            error: `Failed to create profile: ${createError.message}`,
            authenticated: true,
            user: session.user
          });
        }
        
        return NextResponse.json({
          success: true,
          authenticated: true,
          user: session.user,
          profile: newProfile,
          isCounselor: true,
          message: 'Created counselor profile'
        });
      }
      
      return NextResponse.json({
        success: false,
        error: `Profile error: ${profileError.message}`,
        authenticated: true,
        user: session.user
      });
    }
    
    // Check if the user is a counselor
    const isCounselor = profile.role === 'counselor';
    
    // If this is the counselor email but role is not set correctly, fix it
    if (!isCounselor && session.user.email === 'counselor1@example.com') {
      const { data: updatedProfile, error: updateError } = await supabase
        .from('user_profiles')
        .update({ role: 'counselor', updated_at: new Date().toISOString() })
        .eq('id', session.user.id)
        .select()
        .single();
      
      if (updateError) {
        return NextResponse.json({
          success: false,
          error: `Failed to update profile: ${updateError.message}`,
          authenticated: true,
          user: session.user,
          profile
        });
      }
      
      return NextResponse.json({
        success: true,
        authenticated: true,
        user: session.user,
        profile: updatedProfile,
        isCounselor: true,
        message: 'Updated to counselor role'
      });
    }
    
    return NextResponse.json({
      success: true,
      authenticated: true,
      user: session.user,
      profile,
      isCounselor
    });
  } catch (error) {
    console.error('Error in check-counselor API:', error);
    return NextResponse.json({
      success: false,
      error: `An unexpected error occurred: ${error.message}`
    });
  }
}
