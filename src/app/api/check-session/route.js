import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    // Get the session ID from the query parameters
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('id');
    
    if (!sessionId) {
      return NextResponse.json({
        success: false,
        error: 'Session ID is required'
      }, { status: 400 });
    }
    
    // Initialize Supabase client with cookies
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    console.log('Checking session with ID:', sessionId);
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('Error getting user:', userError);
      return NextResponse.json({
        success: false,
        error: 'Authentication error: ' + userError.message
      }, { status: 401 });
    }
    
    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'User not authenticated'
      }, { status: 401 });
    }
    
    // Check if the session exists
    const { data: sessionData, error: sessionError } = await supabase
      .from('counseling_sessions')
      .select('*')
      .eq('id', sessionId);
    
    if (sessionError) {
      console.error('Error checking session:', sessionError);
      return NextResponse.json({
        success: false,
        error: 'Error checking session: ' + sessionError.message,
        sessionId
      });
    }
    
    if (!sessionData || sessionData.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Session not found',
        sessionId,
        userId: user.id
      });
    }
    
    // Session exists, return the data
    return NextResponse.json({
      success: true,
      session: sessionData[0],
      userId: user.id
    });
  } catch (error) {
    console.error('Error in check-session API:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
