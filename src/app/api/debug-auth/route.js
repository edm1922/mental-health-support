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
      .select('*')
      .eq('id', session.user.id)
      .single();
    
    // Get all tables in the database for debugging
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');
    
    return NextResponse.json({
      success: true,
      authenticated: true,
      userId: session.user.id,
      email: session.user.email,
      profile: profile,
      profileError: profileError,
      tables: tables,
      tablesError: tablesError,
      sessionData: {
        expires_at: session.expires_at,
        user: {
          id: session.user.id,
          email: session.user.email,
          role: session.user.role
        }
      }
    });
  } catch (error) {
    console.error('Unexpected error in debug-auth API:', error);
    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred: ' + error.message,
      authenticated: false
    }, { status: 500 });
  }
}
