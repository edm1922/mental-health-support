import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

// Create a direct Supabase client with admin privileges
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://euebogudyyeodzkvhyef.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV1ZWJvZ3VkeXllb2R6a3ZoeWVmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcwMDAwMDAwMCwiZXhwIjoyMDAwMDAwMDAwfQ.Oi-qM8JYuQIXEf0sMVfQTcwzBBwu3iLLFfVnQNvl8Vc';

export async function GET(request) {
  try {
    // Get session ID from query params
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    
    if (!sessionId) {
      return NextResponse.json({
        success: false,
        error: 'Session ID is required'
      }, { status: 400 });
    }
    
    console.log(`Checking status for session ${sessionId}`);
    
    // Create a fresh Supabase client for each request
    const adminSupabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Check if the session exists
    const { data: sessionData, error: checkError } = await adminSupabase
      .from('counseling_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();
      
    if (checkError) {
      console.log('Error checking session:', checkError);
      
      if (checkError.code === 'PGRST116') {
        return NextResponse.json({
          success: true,
          exists: false,
          message: 'Session does not exist'
        });
      }
      
      return NextResponse.json({
        success: false,
        error: 'Error checking session',
        details: checkError.message
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      exists: true,
      session: sessionData
    });
  } catch (error) {
    console.error('Unexpected error in check-status API:', error);
    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred',
      details: error.message
    }, { status: 500 });
  }
}
