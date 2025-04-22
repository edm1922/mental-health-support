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
    
    console.log('Completely fix session_messages API called');
    
    // Read the SQL file
    const sqlFilePath = path.join(process.cwd(), 'src', 'sql', 'completely_fix_session_messages.sql');
    const sql = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Execute the SQL
    const { error } = await supabase.rpc('exec_sql', { sql });
    
    if (error) {
      console.error('Error fixing session_messages:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to fix session_messages: ' + error.message
      });
    }
    
    return NextResponse.json({
      success: true,
      message: 'session_messages completely fixed successfully'
    });
  } catch (error) {
    console.error('Error in completely fix session_messages API:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
