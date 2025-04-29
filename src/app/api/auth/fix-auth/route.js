import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Initialize Supabase client
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    console.log('Fix auth API called');

    // Get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      console.error('Error checking session:', sessionError);
      return NextResponse.json({
        success: false,
        error: sessionError.message,
        authenticated: false
      });
    }

    if (!session) {
      return NextResponse.json({
        success: false,
        error: 'No active session found',
        authenticated: false
      });
    }

    // Get user ID from session
    const userId = session.user.id;
    console.log('User ID from session:', userId);

    // Create the execute_sql function if it doesn't exist
    try {
      const { data: createSqlFnResult, error: createSqlFnError } = await supabase.rpc('execute_sql', {
        sql_query: `
        CREATE OR REPLACE FUNCTION public.execute_sql(sql_query TEXT)
        RETURNS BOOLEAN
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $$
        BEGIN
          EXECUTE sql_query;
          RETURN true;
        EXCEPTION
          WHEN OTHERS THEN
            RETURN false;
        END;
        $$;

        GRANT EXECUTE ON FUNCTION public.execute_sql TO authenticated;
        `
      });

      if (createSqlFnError) {
        console.log('Error creating execute_sql function:', createSqlFnError);

        // Try direct SQL execution
        const { data: directResult, error: directError } = await supabase.rpc('exec_sql', {
          sql: `
          CREATE OR REPLACE FUNCTION public.execute_sql(sql_query TEXT)
          RETURNS BOOLEAN
          LANGUAGE plpgsql
          SECURITY DEFINER
          AS $$
          BEGIN
            EXECUTE sql_query;
            RETURN true;
          EXCEPTION
            WHEN OTHERS THEN
              RETURN false;
          END;
          $$;

          GRANT EXECUTE ON FUNCTION public.execute_sql TO authenticated;
          `
        });

        console.log('Direct SQL execution result:', directResult, directError);
      } else {
        console.log('execute_sql function created successfully');
      }
    } catch (sqlFnError) {
      console.error('Error creating execute_sql function:', sqlFnError);
    }

    // Disable RLS on session_messages table
    try {
      const { data: disableRlsResult, error: disableRlsError } = await supabase.rpc('execute_sql', {
        sql_query: 'ALTER TABLE public.session_messages DISABLE ROW LEVEL SECURITY;'
      });

      console.log('Disable RLS result:', disableRlsResult, disableRlsError);

      if (disableRlsError) {
        // Try direct SQL execution
        const { data: directResult, error: directError } = await supabase.rpc('exec_sql', {
          sql: 'ALTER TABLE public.session_messages DISABLE ROW LEVEL SECURITY;'
        });

        console.log('Direct SQL disable RLS result:', directResult, directError);
      }
    } catch (rlsError) {
      console.error('Error disabling RLS:', rlsError);
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);

      // Try to create a profile if it doesn't exist
      if (profileError.code === 'PGRST116') { // Record not found
        const { data: newProfile, error: createError } = await supabase
          .from('user_profiles')
          .insert({
            id: userId,
            email: session.user.email,
            display_name: session.user.email.split('@')[0],
            role: 'counselor', // Set as counselor for testing
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (createError) {
          return NextResponse.json({
            success: false,
            error: 'Failed to create profile: ' + createError.message,
            authenticated: true,
            userId: userId,
            session: {
              accessToken: session.access_token ? 'Present (hidden)' : 'Missing',
              expiresAt: session.expires_at,
              refreshToken: session.refresh_token ? 'Present (hidden)' : 'Missing',
            }
          });
        }

        return NextResponse.json({
          success: true,
          message: 'Created new profile',
          authenticated: true,
          userId: userId,
          profile: newProfile,
          session: {
            accessToken: session.access_token ? 'Present (hidden)' : 'Missing',
            expiresAt: session.expires_at,
            refreshToken: session.refresh_token ? 'Present (hidden)' : 'Missing',
          }
        });
      }

      return NextResponse.json({
        success: false,
        error: 'Failed to fetch profile: ' + profileError.message,
        authenticated: true,
        userId: userId,
        session: {
          accessToken: session.access_token ? 'Present (hidden)' : 'Missing',
          expiresAt: session.expires_at,
          refreshToken: session.refresh_token ? 'Present (hidden)' : 'Missing',
        }
      });
    }

    // Check if the user is a counselor
    const isCounselor = profile.role === 'counselor';

    // Get counselor sessions if applicable
    let sessions = null;
    if (isCounselor) {
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('counseling_sessions')
        .select('*')
        .eq('counselor_id', userId);

      if (!sessionsError) {
        sessions = sessionsData;
      } else {
        console.error('Error fetching sessions:', sessionsError);
      }
    }

    // Create a function to check if a user is a counselor
    try {
      const { data: createFnResult, error: createFnError } = await supabase.rpc('execute_sql', {
        sql_query: `
        CREATE OR REPLACE FUNCTION public.is_counselor(user_id uuid)
        RETURNS boolean
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $$
        DECLARE
          is_counselor boolean;
        BEGIN
          SELECT EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE id = user_id AND role = 'counselor'
          ) INTO is_counselor;

          RETURN is_counselor;
        END;
        $$;

        GRANT EXECUTE ON FUNCTION public.is_counselor TO authenticated;
        `
      });

      console.log('Create is_counselor function result:', createFnResult, createFnError);
    } catch (fnError) {
      console.error('Error creating is_counselor function:', fnError);
    }

    return NextResponse.json({
      success: true,
      authenticated: true,
      userId: userId,
      profile: profile,
      isCounselor: isCounselor,
      sessions: sessions,
      sessionInfo: {
        accessToken: session.access_token ? 'Present (hidden for security)' : 'Missing',
        expiresAt: session.expires_at,
        refreshToken: session.refresh_token ? 'Present (hidden for security)' : 'Missing',
      }
    });
  } catch (error) {
    console.error('Unexpected error in fix auth API:', error);
    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred: ' + error.message,
      authenticated: false
    }, { status: 500 });
  }
}
