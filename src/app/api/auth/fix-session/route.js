import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    // Get the session data from the request
    const { session } = await request.json();
    
    if (!session || !session.access_token || !session.user || !session.user.id) {
      return NextResponse.json({ 
        success: false, 
        error: 'Valid session data is required' 
      }, { status: 400 });
    }
    
    // Initialize cookie store
    const cookieStore = cookies();
    
    // Set the cookies directly
    cookieStore.set('sb-access-token', session.access_token, {
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      sameSite: 'lax'
    });
    
    if (session.refresh_token) {
      cookieStore.set('sb-refresh-token', session.refresh_token, {
        path: '/',
        maxAge: 60 * 60 * 24 * 30, // 30 days
        sameSite: 'lax'
      });
    }
    
    // Also set the Supabase-specific cookies
    cookieStore.set('sb-euebogudyyeodzkvhyef-auth-token', session.access_token, {
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      sameSite: 'lax'
    });
    
    if (session.refresh_token) {
      cookieStore.set('sb-euebogudyyeodzkvhyef-auth-token-refresh', session.refresh_token, {
        path: '/',
        maxAge: 60 * 60 * 24 * 30, // 30 days
        sameSite: 'lax'
      });
    }
    
    // Initialize Supabase client with the updated cookies
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Verify the session was set correctly
    const { data: { session: verifiedSession }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to verify session: ' + sessionError.message
      }, { status: 500 });
    }
    
    // Also ensure the user profile exists
    if (verifiedSession && verifiedSession.user) {
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('id, role')
        .eq('id', verifiedSession.user.id)
        .single();
      
      if (profileError && profileError.code === 'PGRST116') { // Not found
        // Create a profile for this user
        const { error: createError } = await supabase
          .from('user_profiles')
          .insert({
            id: verifiedSession.user.id,
            display_name: verifiedSession.user.email?.split('@')[0] || 'User',
            role: 'counselor', // Set as counselor since this is for the counselor portal
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        
        if (createError) {
          console.error('Error creating profile:', createError);
        }
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'Session fixed successfully',
      verified: !!verifiedSession,
      user: verifiedSession?.user ? {
        id: verifiedSession.user.id,
        email: verifiedSession.user.email
      } : null
    });
  } catch (error) {
    console.error('Unexpected error in fix-session:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'An unexpected error occurred: ' + error.message
    }, { status: 500 });
  }
}
