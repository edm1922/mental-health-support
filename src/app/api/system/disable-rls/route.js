import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic'; // This ensures the route is always dynamic

export async function POST(request) {
  try {
    console.log('Disable RLS API called');

    // Create a server-side client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Missing Supabase environment variables');
      return NextResponse.json(
        { error: 'Server configuration error - Missing API credentials' },
        { status: 500 }
      );
    }

    console.log('Creating client with URL:', supabaseUrl);
    const supabaseServer = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });

    // Try to disable RLS on user_profiles
    try {
      const { data, error } = await supabaseServer.rpc('exec_sql', {
        sql: `
          -- Disable RLS on user_profiles
          ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;
          
          -- Drop existing policies to start fresh
          DROP POLICY IF EXISTS "Users can read all profiles" ON public.user_profiles;
          DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;
          DROP POLICY IF EXISTS "Users can insert their own profile" ON public.user_profiles;
          DROP POLICY IF EXISTS "Users can delete their own profile" ON public.user_profiles;
          
          -- Create a permissive policy that allows all operations
          CREATE POLICY "Allow all operations on user_profiles" 
          ON public.user_profiles
          FOR ALL
          USING (true)
          WITH CHECK (true);
        `
      });

      if (error) {
        console.error('Error disabling RLS:', error);
        return NextResponse.json(
          { error: 'Failed to disable RLS: ' + error.message },
          { status: 500 }
        );
      }

      console.log('RLS disabled successfully');
      return NextResponse.json({
        success: true,
        message: 'RLS disabled successfully'
      });
    } catch (sqlError) {
      console.error('Exception executing SQL:', sqlError);
      return NextResponse.json(
        { error: 'Exception executing SQL: ' + (sqlError.message || 'Unknown error') },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Exception in disable RLS API:', error);
    return NextResponse.json(
      { error: 'Failed to disable RLS: ' + (error.message || 'Unknown error') },
      { status: 500 }
    );
  }
}
