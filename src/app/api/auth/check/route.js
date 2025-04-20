import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Initialize Supabase client
    const supabase = createRouteHandlerClient({ cookies });

    // Get the session if available
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json({
        authenticated: false,
        message: "Not authenticated"
      });
    }
    
    // Check if the user has a profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();
    
    if (profileError && profileError.code === 'PGRST116') {
      // Profile doesn't exist, create one
      const displayName = session.user.user_metadata?.display_name ||
                        session.user.email?.split('@')[0] ||
                        'User';
      
      const { error: createError } = await supabase
        .from('user_profiles')
        .insert({
          id: session.user.id,
          display_name: displayName,
          bio: '',
          role: 'user',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      
      if (createError) {
        console.error('Error creating profile:', createError);
        return NextResponse.json({
          authenticated: true,
          user: session.user,
          profile_created: false,
          error: createError.message
        });
      }
      
      return NextResponse.json({
        authenticated: true,
        user: session.user,
        profile_created: true
      });
    } else if (profileError) {
      console.error('Error checking profile:', profileError);
      return NextResponse.json({
        authenticated: true,
        user: session.user,
        profile_error: profileError.message
      });
    }
    
    return NextResponse.json({
      authenticated: true,
      user: session.user,
      profile: profile
    });
  } catch (error) {
    console.error('Error in auth check:', error);
    return NextResponse.json({
      authenticated: false,
      error: error.message
    }, { status: 500 });
  }
}
