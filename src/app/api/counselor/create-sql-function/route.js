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
        error: 'Only admins can create SQL functions'
      }, { status: 403 });
    }

    // Read the SQL file
    const sqlFilePath = path.join(process.cwd(), 'src', 'app', 'api', 'counselor', 'create-count-messages-function.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

    // Execute the SQL
    const { error: sqlError } = await supabase.rpc('exec_sql', {
      sql: sqlContent
    });

    if (sqlError) {
      console.error('Error creating SQL function:', sqlError);
      return NextResponse.json({
        success: false,
        error: 'Failed to create SQL function: ' + sqlError.message
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'SQL function created successfully'
    });
  } catch (error) {
    console.error('Unexpected error creating SQL function:', error);
    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred'
    }, { status: 500 });
  }
}
