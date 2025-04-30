import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { fixDatabaseSchema } from '@/utils/databaseMigrations';

export async function POST(request) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing or invalid authorization header' }, { status: 401 });
    }

    // Initialize Supabase client
    const supabase = createRouteHandlerClient({ cookies });

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Authentication failed', details: userError?.message }, { status: 401 });
    }

    // Check if the user is an admin
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError) {
      return NextResponse.json({ error: 'Failed to fetch user profile', details: profileError.message }, { status: 500 });
    }

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Only admins can perform this action' }, { status: 403 });
    }

    // Run the database schema fix
    const result = await fixDatabaseSchema();

    if (!result.success) {
      return NextResponse.json({
        error: result.message,
        operations: result.operations || [],
        success: false
      }, { status: 500 });
    }

    return NextResponse.json({
      message: result.message,
      operations: result.operations || [],
      success: true
    }, { status: 200 });
  } catch (error) {
    console.error('Error fixing database schema:', error);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}
