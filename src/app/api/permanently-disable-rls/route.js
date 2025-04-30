import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Initialize Supabase client with cookies
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    console.log('Permanently disabling RLS on all relevant tables');
    
    // Read the SQL file
    const sqlFilePath = path.join(process.cwd(), 'src', 'sql', 'permanently_disable_rls.sql');
    const sqlQuery = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Execute the SQL query
    const { error } = await supabase.rpc('exec_sql', { sql: sqlQuery });
    
    if (error) {
      console.error('Error permanently disabling RLS:', error);
      
      // If the error is related to pg_cron, try a simpler approach
      if (error.message.includes('pg_cron') || error.message.includes('cron.schedule')) {
        console.log('Trying simpler approach without pg_cron...');
        
        // Simple approach: just disable RLS and create the function
        const { error: simpleError } = await supabase.rpc('exec_sql', { 
          sql: `
          -- Disable RLS on both tables
          ALTER TABLE public.session_messages DISABLE ROW LEVEL SECURITY;
          ALTER TABLE public.counseling_sessions DISABLE ROW LEVEL SECURITY;
          
          -- Add comments to the tables to indicate RLS should be disabled
          COMMENT ON TABLE public.session_messages IS 'RLS DISABLED PERMANENTLY - DO NOT ENABLE';
          COMMENT ON TABLE public.counseling_sessions IS 'RLS DISABLED PERMANENTLY - DO NOT ENABLE';
          
          -- Create a function to check and disable RLS if it gets enabled
          CREATE OR REPLACE FUNCTION public.ensure_rls_disabled()
          RETURNS void AS $$
          DECLARE
            session_messages_rls_enabled boolean;
            counseling_sessions_rls_enabled boolean;
          BEGIN
            -- Check if RLS is enabled on session_messages
            SELECT relrowsecurity INTO session_messages_rls_enabled
            FROM pg_class
            WHERE relname = 'session_messages' AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
            
            -- Check if RLS is enabled on counseling_sessions
            SELECT relrowsecurity INTO counseling_sessions_rls_enabled
            FROM pg_class
            WHERE relname = 'counseling_sessions' AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
            
            -- Disable RLS if it's enabled on session_messages
            IF session_messages_rls_enabled THEN
              RAISE NOTICE 'RLS was enabled on session_messages. Disabling it...';
              ALTER TABLE public.session_messages DISABLE ROW LEVEL SECURITY;
            END IF;
            
            -- Disable RLS if it's enabled on counseling_sessions
            IF counseling_sessions_rls_enabled THEN
              RAISE NOTICE 'RLS was enabled on counseling_sessions. Disabling it...';
              ALTER TABLE public.counseling_sessions DISABLE ROW LEVEL SECURITY;
            END IF;
          END;
          $$ LANGUAGE plpgsql SECURITY DEFINER;
          
          -- Final check to make sure RLS is disabled
          SELECT public.ensure_rls_disabled();
          `
        });
        
        if (simpleError) {
          console.error('Error with simpler approach:', simpleError);
          return NextResponse.json({
            success: false,
            error: 'Failed to permanently disable RLS: ' + simpleError.message
          });
        }
        
        return NextResponse.json({
          success: true,
          message: 'RLS has been disabled using a simpler approach. You may need to run this endpoint periodically to ensure RLS stays disabled.'
        });
      }
      
      return NextResponse.json({
        success: false,
        error: 'Failed to permanently disable RLS: ' + error.message
      });
    }
    
    return NextResponse.json({
      success: true,
      message: 'RLS has been permanently disabled on all relevant tables'
    });
  } catch (error) {
    console.error('Error in permanently-disable-rls API:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
