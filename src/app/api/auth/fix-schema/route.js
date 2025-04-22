import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Initialize Supabase client with cookies
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    console.log('Fix schema API called');
    
    // Get the current user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      console.error('Error getting session:', sessionError || 'No session found');
      return NextResponse.json({
        success: false,
        error: 'Authentication required',
        message: 'You must be logged in to fix the schema'
      });
    }
    
    const userId = session.user.id;
    console.log('Current user ID from session:', userId);
    
    // Check if user has admin role
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', userId)
      .single();
    
    if (profileError) {
      console.error('Error checking user role:', profileError);
      return NextResponse.json({
        success: false,
        error: 'Failed to check user role: ' + profileError.message
      });
    }
    
    if (userProfile?.role !== 'admin') {
      console.error('User is not an admin');
      return NextResponse.json({
        success: false,
        error: 'Admin privileges required',
        message: 'You must be an admin to fix the schema'
      });
    }
    
    // Execute SQL to fix schema issues
    const { data: sqlResult, error: sqlError } = await supabase.rpc('exec_sql', { 
      sql: `
      -- Create function to get current user ID
      CREATE OR REPLACE FUNCTION public.get_current_user()
      RETURNS uuid
      LANGUAGE sql
      SECURITY DEFINER
      AS $$
        SELECT auth.uid()::uuid;
      $$;

      -- Create function to get messages for current user
      CREATE OR REPLACE FUNCTION public.get_messages_for_user()
      RETURNS TABLE (
        id uuid,
        session_id uuid,
        sender_id uuid,
        recipient_id uuid,
        message text,
        is_read boolean,
        created_at timestamptz,
        updated_at timestamptz
      )
      LANGUAGE sql
      SECURITY DEFINER
      AS $$
        SELECT 
          id, 
          session_id, 
          sender_id, 
          recipient_id, 
          message, 
          is_read, 
          created_at, 
          updated_at
        FROM 
          public.session_messages
        WHERE 
          sender_id = get_current_user() OR 
          recipient_id = get_current_user()
        ORDER BY 
          created_at DESC;
      $$;

      -- Create function to check if user has messages
      CREATE OR REPLACE FUNCTION public.user_has_messages()
      RETURNS boolean
      LANGUAGE sql
      SECURITY DEFINER
      AS $$
        SELECT EXISTS (
          SELECT 1 
          FROM public.session_messages 
          WHERE sender_id = get_current_user() OR recipient_id = get_current_user()
        );
      $$;

      -- Create function to check if user has sessions
      CREATE OR REPLACE FUNCTION public.user_has_sessions()
      RETURNS boolean
      LANGUAGE sql
      SECURITY DEFINER
      AS $$
        SELECT EXISTS (
          SELECT 1 
          FROM public.counseling_sessions 
          WHERE counselor_id = get_current_user() OR patient_id = get_current_user()
        );
      $$;

      -- Create function to get all messages (admin only)
      CREATE OR REPLACE FUNCTION public.get_all_messages()
      RETURNS TABLE (
        id uuid,
        session_id uuid,
        sender_id uuid,
        recipient_id uuid,
        message text,
        is_read boolean,
        created_at timestamptz,
        updated_at timestamptz,
        sender_name text,
        recipient_name text
      )
      LANGUAGE sql
      SECURITY DEFINER
      AS $$
        SELECT 
          m.id, 
          m.session_id, 
          m.sender_id, 
          m.recipient_id, 
          m.message, 
          m.is_read, 
          m.created_at, 
          m.updated_at,
          sender.display_name as sender_name,
          recipient.display_name as recipient_name
        FROM 
          public.session_messages m
        LEFT JOIN
          public.user_profiles sender ON m.sender_id = sender.id
        LEFT JOIN
          public.user_profiles recipient ON m.recipient_id = recipient.id
        ORDER BY 
          m.created_at DESC;
      $$;

      -- Enable RLS on session_messages
      ALTER TABLE IF EXISTS public.session_messages ENABLE ROW LEVEL SECURITY;

      -- Create policy to allow users to see their own messages
      DROP POLICY IF EXISTS "Users can view their own messages" ON public.session_messages;
      CREATE POLICY "Users can view their own messages"
      ON public.session_messages
      FOR SELECT
      USING (sender_id::text = auth.uid()::text OR recipient_id::text = auth.uid()::text);

      -- Create policy to allow users to insert messages
      DROP POLICY IF EXISTS "Users can insert messages" ON public.session_messages;
      CREATE POLICY "Users can insert messages"
      ON public.session_messages
      FOR INSERT
      WITH CHECK (sender_id::text = auth.uid()::text);

      -- Create policy to allow users to update their own messages
      DROP POLICY IF EXISTS "Users can update their own messages" ON public.session_messages;
      CREATE POLICY "Users can update their own messages"
      ON public.session_messages
      FOR UPDATE
      USING (sender_id::text = auth.uid()::text);

      -- Create policy to allow users to delete their own messages
      DROP POLICY IF EXISTS "Users can delete their own messages" ON public.session_messages;
      CREATE POLICY "Users can delete their own messages"
      ON public.session_messages
      FOR DELETE
      USING (sender_id::text = auth.uid()::text);

      -- Create policy to allow admins to see all messages
      DROP POLICY IF EXISTS "Admins can view all messages" ON public.session_messages;
      CREATE POLICY "Admins can view all messages"
      ON public.session_messages
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 
          FROM public.user_profiles 
          WHERE id::text = auth.uid()::text AND role = 'admin'
        )
      );

      -- Create policy to allow admins to update all messages
      DROP POLICY IF EXISTS "Admins can update all messages" ON public.session_messages;
      CREATE POLICY "Admins can update all messages"
      ON public.session_messages
      FOR UPDATE
      USING (
        EXISTS (
          SELECT 1 
          FROM public.user_profiles 
          WHERE id::text = auth.uid()::text AND role = 'admin'
        )
      );

      -- Create policy to allow admins to delete all messages
      DROP POLICY IF EXISTS "Admins can delete all messages" ON public.session_messages;
      CREATE POLICY "Admins can delete all messages"
      ON public.session_messages
      FOR DELETE
      USING (
        EXISTS (
          SELECT 1 
          FROM public.user_profiles 
          WHERE id::text = auth.uid()::text AND role = 'admin'
        )
      );
      `
    });
    
    if (sqlError) {
      console.error('Error executing SQL:', sqlError);
      return NextResponse.json({
        success: false,
        error: 'Failed to execute SQL: ' + sqlError.message
      });
    }
    
    console.log('SQL executed successfully');
    
    return NextResponse.json({
      success: true,
      message: 'Schema fixed successfully'
    });
  } catch (error) {
    console.error('Error in fix schema API:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
