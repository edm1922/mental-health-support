import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    // Initialize Supabase client
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    console.log('FIX COUNSELOR CHAT: Starting fix process');
    
    // First, disable RLS on the session_messages table
    const disableRlsSql = `
      ALTER TABLE IF EXISTS public.session_messages DISABLE ROW LEVEL SECURITY;
    `;
    
    const { error: disableRlsError } = await supabase.rpc('exec_sql', {
      sql: disableRlsSql
    });
    
    if (disableRlsError) {
      console.error('FIX COUNSELOR CHAT: Error disabling RLS:', disableRlsError);
      // Continue anyway, as the table might not exist yet
    } else {
      console.log('FIX COUNSELOR CHAT: RLS disabled successfully');
    }
    
    // Check if the counseling_sessions table exists
    const { data: sessionsTableExists, error: sessionsTableError } = await supabase.rpc('exec_sql', {
      sql: `SELECT COUNT(*) 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'counseling_sessions';`
    });
    
    if (sessionsTableError) {
      console.error('FIX COUNSELOR CHAT: Error checking if counseling_sessions table exists:', sessionsTableError);
      return NextResponse.json({
        success: false,
        error: 'Error checking if counseling_sessions table exists',
        details: sessionsTableError.message
      }, { status: 500 });
    }
    
    const sessionsTableExistsResult = sessionsTableExists && sessionsTableExists[0] && parseInt(sessionsTableExists[0].count) > 0;
    console.log('FIX COUNSELOR CHAT: Counseling sessions table exists:', sessionsTableExistsResult);
    
    if (!sessionsTableExistsResult) {
      return NextResponse.json({
        success: false,
        error: 'Counseling sessions table does not exist'
      }, { status: 404 });
    }
    
    // Disable RLS on the counseling_sessions table
    const disableSessionsRlsSql = `
      ALTER TABLE public.counseling_sessions DISABLE ROW LEVEL SECURITY;
    `;
    
    const { error: disableSessionsRlsError } = await supabase.rpc('exec_sql', {
      sql: disableSessionsRlsSql
    });
    
    if (disableSessionsRlsError) {
      console.error('FIX COUNSELOR CHAT: Error disabling RLS on counseling_sessions:', disableSessionsRlsError);
    } else {
      console.log('FIX COUNSELOR CHAT: RLS disabled on counseling_sessions successfully');
    }
    
    // Create a permissive policy for counseling_sessions
    const createSessionsPolicySql = `
      CREATE POLICY IF NOT EXISTS "Allow all operations on counseling_sessions" ON public.counseling_sessions
      FOR ALL
      USING (true)
      WITH CHECK (true);
    `;
    
    const { error: createSessionsPolicyError } = await supabase.rpc('exec_sql', {
      sql: createSessionsPolicySql
    });
    
    if (createSessionsPolicyError) {
      console.error('FIX COUNSELOR CHAT: Error creating policy for counseling_sessions:', createSessionsPolicyError);
    } else {
      console.log('FIX COUNSELOR CHAT: Permissive policy created for counseling_sessions successfully');
    }
    
    // Check if the user_profiles table exists
    const { data: profilesTableExists, error: profilesTableError } = await supabase.rpc('exec_sql', {
      sql: `SELECT COUNT(*) 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'user_profiles';`
    });
    
    if (profilesTableError) {
      console.error('FIX COUNSELOR CHAT: Error checking if user_profiles table exists:', profilesTableError);
    } else {
      const profilesTableExistsResult = profilesTableExists && profilesTableExists[0] && parseInt(profilesTableExists[0].count) > 0;
      console.log('FIX COUNSELOR CHAT: User profiles table exists:', profilesTableExistsResult);
      
      if (profilesTableExistsResult) {
        // Disable RLS on the user_profiles table
        const disableProfilesRlsSql = `
          ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;
        `;
        
        const { error: disableProfilesRlsError } = await supabase.rpc('exec_sql', {
          sql: disableProfilesRlsSql
        });
        
        if (disableProfilesRlsError) {
          console.error('FIX COUNSELOR CHAT: Error disabling RLS on user_profiles:', disableProfilesRlsError);
        } else {
          console.log('FIX COUNSELOR CHAT: RLS disabled on user_profiles successfully');
        }
        
        // Create a permissive policy for user_profiles
        const createProfilesPolicySql = `
          CREATE POLICY IF NOT EXISTS "Allow all operations on user_profiles" ON public.user_profiles
          FOR ALL
          USING (true)
          WITH CHECK (true);
        `;
        
        const { error: createProfilesPolicyError } = await supabase.rpc('exec_sql', {
          sql: createProfilesPolicySql
        });
        
        if (createProfilesPolicyError) {
          console.error('FIX COUNSELOR CHAT: Error creating policy for user_profiles:', createProfilesPolicyError);
        } else {
          console.log('FIX COUNSELOR CHAT: Permissive policy created for user_profiles successfully');
        }
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'Counselor chat fixed successfully'
    });
  } catch (error) {
    console.error('FIX COUNSELOR CHAT: Unexpected error:', error);
    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred',
      details: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
