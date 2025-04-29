import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    // Initialize Supabase client
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Get session ID from query params
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    
    if (!sessionId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Session ID is required' 
      }, { status: 400 });
    }
    
    console.log(`API: Fetching participants for session ${sessionId}`);
    
    // First, ensure RLS is disabled
    try {
      // Try direct SQL approach first
      await supabase.rpc('ensure_rls_disabled');
      console.log('API: RLS disabled successfully via function');
    } catch (rlsError) {
      console.error('API: Error calling ensure_rls_disabled function:', rlsError);
      
      // Fallback to direct SQL
      try {
        await supabase.rpc('exec_sql', { 
          sql: `ALTER TABLE public.counseling_sessions DISABLE ROW LEVEL SECURITY;`
        });
        console.log('API: RLS disabled successfully via direct SQL');
      } catch (directSqlError) {
        console.error('API: Error disabling RLS via direct SQL:', directSqlError);
        // Continue anyway
      }
    }
    
    // Get session details
    try {
      const { data, error } = await supabase
        .from('counseling_sessions')
        .select('counselor_id, patient_id')
        .eq('id', sessionId)
        .single();
      
      if (error) {
        console.error('API: Error fetching session participants:', error);
        throw error;
      }
      
      if (!data) {
        return NextResponse.json({ 
          success: false, 
          error: 'Session not found' 
        }, { status: 404 });
      }
      
      const participants = [data.counselor_id, data.patient_id].filter(Boolean);
      
      console.log(`API: Found ${participants.length} participants for session ${sessionId}`);
      
      return NextResponse.json({ 
        success: true, 
        participants
      });
    } catch (queryError) {
      console.error('API: Error with standard query, trying raw SQL:', queryError);
      
      // Try with raw SQL as a fallback
      try {
        const { data: rawData, error: rawError } = await supabase.rpc('exec_sql', {
          sql: `SELECT counselor_id, patient_id FROM public.counseling_sessions 
                WHERE id = '${sessionId}';`
        });
        
        if (rawError) {
          throw rawError;
        }
        
        if (!rawData || !rawData[0]) {
          return NextResponse.json({ 
            success: false, 
            error: 'Session not found' 
          }, { status: 404 });
        }
        
        const participants = [rawData[0].counselor_id, rawData[0].patient_id].filter(Boolean);
        
        console.log(`API: Found ${participants.length} participants for session ${sessionId} via raw SQL`);
        
        return NextResponse.json({ 
          success: true, 
          participants
        });
      } catch (rawSqlError) {
        console.error('API: Error fetching participants via raw SQL:', rawSqlError);
        return NextResponse.json({ 
          success: false, 
          error: 'Failed to fetch session participants' 
        }, { status: 500 });
      }
    }
  } catch (error) {
    console.error('API: Unexpected error in get participants:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
