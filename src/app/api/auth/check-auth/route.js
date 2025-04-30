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
        authenticated: false, 
        error: sessionError.message 
      });
    }
    
    if (!session) {
      return NextResponse.json({ authenticated: false });
    }
    
    // Get user details
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('Error getting user:', userError);
      return NextResponse.json({ 
        authenticated: false, 
        error: userError.message 
      });
    }
    
    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at
      },
      session: {
        expires_at: session.expires_at
      }
    });
  } catch (error) {
    console.error('Unexpected error in check-auth:', error);
    return NextResponse.json({ 
      authenticated: false, 
      error: error.message 
    }, { status: 500 });
  }
}
