import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic'; // This ensures the route is always dynamic

export async function GET() {
  try {
    // Initialize Supabase client
    const supabase = createRouteHandlerClient({ cookies });

    // Get the session if available
    const { data: { session } } = await supabase.auth.getSession();
    console.log('Session:', session ? 'User is authenticated' : 'No session');

    // Get RLS policies for discussion_posts
    const { data: policies, error } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT 
          schemaname, 
          tablename, 
          policyname, 
          permissive, 
          roles, 
          cmd, 
          qual, 
          with_check
        FROM 
          pg_policies 
        WHERE 
          tablename = 'discussion_posts' OR tablename = 'discussion_comments'
        ORDER BY 
          tablename, cmd;
      `
    });

    if (error) {
      console.error('Error fetching RLS policies:', error);
      return NextResponse.json(
        { error: 'Failed to fetch RLS policies: ' + error.message },
        { status: 500 }
      );
    }

    // Get the current user's session details
    const sessionDetails = session ? {
      user_id: session.user.id,
      email: session.user.email,
      role: session.user.role
    } : null;

    // Get the auth.uid() value
    const { data: authUid, error: authError } = await supabase.rpc('exec_sql', {
      sql: `SELECT auth.uid();`
    });

    if (authError) {
      console.error('Error fetching auth.uid():', authError);
    }

    return NextResponse.json({
      policies,
      session: sessionDetails,
      auth_uid: authUid
    });
  } catch (error) {
    console.error('Unexpected error in RLS policies API:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}
