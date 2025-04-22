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

    console.log('Running enhanced script to permanently disable RLS');

    // Read the SQL file
    const sqlFilePath = path.join(process.cwd(), 'src', 'sql', 'simple_disable_rls.sql');
    const sqlQuery = fs.readFileSync(sqlFilePath, 'utf8');

    // Execute the SQL query
    const { error } = await supabase.rpc('exec_sql', { sql: sqlQuery });

    if (error) {
      console.error('Error disabling RLS:', error);

      // Try a more direct approach if the script fails
      console.log('Trying direct approach...');

      // Disable RLS on session_messages table
      const { error: messagesError } = await supabase.rpc('exec_sql', {
        sql: `ALTER TABLE public.session_messages DISABLE ROW LEVEL SECURITY;`
      });

      if (messagesError) {
        console.error('Error disabling RLS on session_messages:', messagesError);
        return NextResponse.json({
          success: false,
          error: 'Failed to disable RLS on session_messages: ' + messagesError.message
        });
      }

      // Disable RLS on counseling_sessions table
      const { error: sessionsError } = await supabase.rpc('exec_sql', {
        sql: `ALTER TABLE public.counseling_sessions DISABLE ROW LEVEL SECURITY;`
      });

      if (sessionsError) {
        console.error('Error disabling RLS on counseling_sessions:', sessionsError);
        return NextResponse.json({
          success: false,
          error: 'Failed to disable RLS on counseling_sessions: ' + sessionsError.message
        });
      }

      return NextResponse.json({
        success: true,
        message: 'RLS has been disabled using direct approach. You may need to run this endpoint again if RLS gets re-enabled.'
      });
    }

    return NextResponse.json({
      success: true,
      message: 'RLS has been permanently disabled on all relevant tables and a trigger has been created to help keep it disabled.'
    });
  } catch (error) {
    console.error('Error in simple-disable-rls API:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
