import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Initialize Supabase client
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    console.log('Fix counselor API called');
    
    // Try to sign in as the counselor
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'counselor1@example.com',
      password: 'counselor'
    });
    
    if (signInError) {
      return NextResponse.json({
        success: false,
        error: `Failed to sign in as counselor: ${signInError.message}`
      });
    }
    
    if (!signInData.user) {
      return NextResponse.json({
        success: false,
        error: 'Failed to get counselor user after sign-in'
      });
    }
    
    // Update the counselor profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .upsert({
        id: signInData.user.id,
        display_name: 'Counselor',
        role: 'counselor',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (profileError) {
      return NextResponse.json({
        success: false,
        error: `Failed to update counselor profile: ${profileError.message}`
      });
    }
    
    // Sign out after updating the profile
    await supabase.auth.signOut();
    
    return NextResponse.json({
      success: true,
      message: 'Counselor role fixed successfully',
      user: signInData.user,
      profile
    });
  } catch (error) {
    console.error('Error in fix-counselor API:', error);
    return NextResponse.json({
      success: false,
      error: `An unexpected error occurred: ${error.message}`
    });
  }
}
