import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { supabase } from '@/utils/supabaseClient';

export const dynamic = 'force-dynamic'; // This ensures the route is always dynamic

export async function GET(request) {
  try {
    console.log('Auth test GET API called');

    // Initialize Supabase client using cookies
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Get the current session
    const { data, error: sessionError } = await supabase.auth.getSession();
    const session = data?.session;

    console.log('Session data:', session ? 'Session found' : 'No session');

    if (sessionError) {
      console.error('Auth error:', sessionError);
      return NextResponse.json({
        success: false,
        error: 'Authentication error: ' + sessionError.message
      }, { status: 401 });
    }

    if (!session?.user) {
      console.error('No authenticated user found');
      return NextResponse.json({
        success: false,
        error: 'No authenticated user found'
      }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      message: 'Authentication successful',
      user: {
        id: session.user.id,
        email: session.user.email
      }
    });
  } catch (error) {
    console.error('Exception in auth test GET API:', error);
    return NextResponse.json({
      success: false,
      error: 'Exception in auth test API: ' + (error.message || 'Unknown error')
    }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    console.log('Auth test POST API called');

    // Get cookies from the request
    const cookieHeader = request.headers.get('cookie');
    console.log('Cookie header present:', !!cookieHeader);

    // Create a server-side client with the cookies
    const supabaseServer = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://euebogudyyeodzkvhyef.supabase.co',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV1ZWJvZ3VkeXllb2R6a3ZoeWVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4NjM5NDgsImV4cCI6MjA2MDQzOTk0OH0.b68JOxrpuFwWb2K3DraYvv32uqomvK0r1imbOCG0HKc',
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
        global: {
          headers: {
            cookie: cookieHeader || '',
          },
        },
      }
    );

    // Get the current user
    const { data, error: sessionError } = await supabaseServer.auth.getSession();
    const session = data?.session;

    console.log('Session data:', session ? 'Session found' : 'No session');

    if (sessionError) {
      console.error('Auth error:', sessionError);
      return NextResponse.json({
        success: false,
        error: 'Authentication error: ' + sessionError.message,
        errorDetails: sessionError
      });
    }

    if (!session?.user) {
      console.error('No authenticated user found');
      return NextResponse.json({
        success: false,
        error: 'No authenticated user found',
        sessionData: data
      });
    }

    // Try to get user from the database
    const { data: profileData, error: profileError } = await supabaseServer
      .from('user_profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    return NextResponse.json({
      success: true,
      message: 'Authentication successful',
      user: {
        id: session.user.id,
        email: session.user.email,
        metadata: session.user.user_metadata
      },
      profile: profileError ? null : profileData,
      profileError: profileError ? profileError.message : null
    });
  } catch (error) {
    console.error('Exception in auth test API:', error);
    return NextResponse.json({
      success: false,
      error: 'Exception in auth test API: ' + (error.message || 'Unknown error'),
      stack: error.stack
    });
  }
}
