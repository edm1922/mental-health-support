import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Initialize Supabase client
    const supabase = createRouteHandlerClient({ cookies });

    // Get the session if available
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Error fetching session:', sessionError);
      return NextResponse.json(
        { error: 'Failed to fetch session: ' + sessionError.message },
        { status: 500 }
      );
    }

    // Get all cookies for debugging
    const allCookies = cookies().getAll();
    const cookieNames = allCookies.map(c => c.name);

    // Try to get the user directly
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    // Check if the user has a profile
    let userProfile = null;
    if (session?.user) {
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
      
      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Error fetching user profile:', profileError);
      } else {
        userProfile = profile;
      }
    }

    return NextResponse.json({
      authenticated: !!session,
      session_exists: !!session,
      user_exists: !!user,
      session: session ? {
        user_id: session.user.id,
        email: session.user.email,
        role: session.user.role,
        user_metadata: session.user.user_metadata
      } : null,
      user: user || null,
      cookies: cookieNames,
      user_profile: userProfile,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Unexpected error in auth status API:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message, stack: error.stack },
      { status: 500 }
    );
  }
}
