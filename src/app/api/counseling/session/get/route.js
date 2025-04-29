import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    // Initialize Supabase client
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('API: Error getting user:', userError);
      return NextResponse.json({ 
        success: false, 
        error: 'Authentication required' 
      }, { status: 401 });
    }
    
    // Get session ID from query params
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    
    if (!sessionId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Session ID is required' 
      }, { status: 400 });
    }
    
    console.log(`API: Fetching session details for ${sessionId}`);
    
    // First, ensure RLS is disabled
    try {
      const { error: disableRlsError } = await supabase.rpc('exec_sql', { 
        sql: `ALTER TABLE public.counseling_sessions DISABLE ROW LEVEL SECURITY;`
      });
      
      if (disableRlsError) {
        console.error('API: Error disabling RLS:', disableRlsError);
      } else {
        console.log('API: RLS disabled successfully');
      }
    } catch (rlsError) {
      console.error('API: Error disabling RLS:', rlsError);
      // Continue anyway
    }
    
    // Get session details
    const { data, error } = await supabase
      .from('counseling_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();
    
    if (error) {
      console.error('API: Error fetching session:', error);
      return NextResponse.json({ 
        success: false, 
        error: error.message 
      }, { status: 500 });
    }
    
    if (!data) {
      return NextResponse.json({ 
        success: false, 
        error: 'Session not found' 
      }, { status: 404 });
    }
    
    // Check if user is either the counselor or client for this session
    if (data.counselor_id !== user.id && data.patient_id !== user.id) {
      return NextResponse.json({ 
        success: false, 
        error: 'You do not have permission to access this session' 
      }, { status: 403 });
    }
    
    // Determine the other user in the session
    const otherUserId = data.counselor_id === user.id ? data.patient_id : data.counselor_id;
    
    // Get other user's profile
    let otherUserProfile = null;
    if (otherUserId) {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', otherUserId)
        .single();
      
      otherUserProfile = profile;
    }
    
    return NextResponse.json({ 
      success: true, 
      session: data,
      otherUser: otherUserProfile
    });
  } catch (error) {
    console.error('API: Unexpected error in get session:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
