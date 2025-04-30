import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';
export const revalidate = 0; // Disable caching completely

export async function GET() {
  try {
    // Initialize Supabase client
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Log cookie information for debugging
    console.log('Cookie store available:', !!cookieStore);
    const allCookies = cookieStore.getAll();
    console.log('Cookies received:', allCookies.map(c => c.name));

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
      console.log('No session found in check-auth');
      return NextResponse.json({
        success: false,
        error: 'No active session found',
        authenticated: false
      });
    }

    // Get user ID from session
    const userId = session.user.id;
    console.log('User ID from session:', userId);

    // Check if the user is a counselor
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('role, display_name, bio')
      .eq('id', userId)
      .single();

    console.log('User profile from check-auth:', profile);

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch user profile',
        authenticated: true,
        isCounselor: false
      });
    }

    const isCounselor = profile?.role === 'counselor';

    return NextResponse.json({
      success: true,
      authenticated: true,
      isCounselor,
      userId,
      role: profile?.role || 'unknown',
      user: {
        id: userId,
        email: session.user.email,
        display_name: profile?.display_name || session.user.email.split('@')[0],
        bio: profile?.bio || '',
        role: profile?.role || 'unknown'
      }
    });
  } catch (error) {
    console.error('Unexpected error in check-auth API:', error);
    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred',
      authenticated: false
    }, { status: 500 });
  }
}
