import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    // Initialize Supabase client
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Get the current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 });
    }

    // Check if user is an admin
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (profileError) {
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch user profile'
      }, { status: 500 });
    }

    if (profile.role !== 'admin') {
      return NextResponse.json({
        success: false,
        error: 'Only admins can execute SQL'
      }, { status: 403 });
    }

    // Get the SQL file path from the request
    const { sqlFile } = await request.json();
    
    if (!sqlFile) {
      return NextResponse.json({
        success: false,
        error: 'SQL file path is required'
      }, { status: 400 });
    }

    // Read the SQL file
    const sqlFilePath = path.join(process.cwd(), sqlFile);
    
    if (!fs.existsSync(sqlFilePath)) {
      return NextResponse.json({
        success: false,
        error: 'SQL file not found'
      }, { status: 404 });
    }
    
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

    // Execute the SQL statements one by one
    const sqlStatements = sqlContent.split(';').filter(stmt => stmt.trim());
    
    for (const stmt of sqlStatements) {
      if (stmt.trim()) {
        const { error } = await supabase.rpc('exec_sql', {
          sql: stmt + ';'
        });

        if (error) {
          console.error('Error executing SQL statement:', error);
          console.error('Statement:', stmt);
          return NextResponse.json({
            success: false,
            error: 'Failed to execute SQL: ' + error.message,
            statement: stmt
          }, { status: 500 });
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'SQL executed successfully'
    });
  } catch (error) {
    console.error('Unexpected error executing SQL:', error);
    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred'
    }, { status: 500 });
  }
}
