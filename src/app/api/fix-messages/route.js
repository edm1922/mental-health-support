import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    console.log('Fix messages API called');
    
    // SQL commands to fix the messages functionality
    const sqlCommands = [
      // Create get_current_user function
      `
      CREATE OR REPLACE FUNCTION get_current_user()
      RETURNS jsonb
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      DECLARE
        current_user_id uuid;
        user_data jsonb;
      BEGIN
        -- Get the current user ID from the auth context
        SELECT auth.uid() INTO current_user_id;
        
        IF current_user_id IS NULL THEN
          RETURN jsonb_build_object('authenticated', false, 'error', 'Not authenticated');
        END IF;
        
        -- Get user data from auth.users
        SELECT jsonb_build_object(
          'id', id,
          'email', email,
          'name', COALESCE(raw_user_meta_data->>'name', email),
          'role', role
        ) INTO user_data
        FROM auth.users
        WHERE id = current_user_id;
        
        IF user_data IS NULL THEN
          RETURN jsonb_build_object('authenticated', false, 'error', 'User not found');
        END IF;
        
        -- Return user data with authentication status
        RETURN jsonb_build_object(
          'authenticated', true,
          'user', user_data
        );
      END;
      $$;
      `,
      
      // Grant execute permissions for get_current_user
      `
      GRANT EXECUTE ON FUNCTION get_current_user() TO authenticated;
      GRANT EXECUTE ON FUNCTION get_current_user() TO anon;
      `,
      
      // Create get_messages_for_user function
      `
      CREATE OR REPLACE FUNCTION get_messages_for_user(user_uuid uuid)
      RETURNS TABLE (
        id uuid,
        session_id uuid,
        sender_id uuid,
        recipient_id uuid,
        message text,
        is_read boolean,
        created_at timestamptz
      )
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      BEGIN
        -- Log the user ID for debugging
        RAISE NOTICE 'Getting messages for user: %', user_uuid;
        
        -- Check if the user exists in user_profiles
        IF NOT EXISTS (SELECT 1 FROM public.user_profiles WHERE id = user_uuid) THEN
          RAISE NOTICE 'User not found in user_profiles: %', user_uuid;
          -- Return empty result set instead of raising an exception
          RETURN;
        END IF;
        
        -- Return messages for the user
        RETURN QUERY
        SELECT 
          sm.id,
          sm.session_id,
          sm.sender_id,
          sm.recipient_id,
          sm.message,
          sm.is_read,
          sm.created_at
        FROM 
          public.session_messages sm
        WHERE 
          sm.sender_id = user_uuid OR sm.recipient_id = user_uuid
        ORDER BY 
          sm.created_at DESC;
      END;
      $$;
      `,
      
      // Grant execute permissions for get_messages_for_user
      `
      GRANT EXECUTE ON FUNCTION get_messages_for_user(uuid) TO authenticated;
      GRANT EXECUTE ON FUNCTION get_messages_for_user(uuid) TO anon;
      `,
      
      // Create user_has_messages function
      `
      CREATE OR REPLACE FUNCTION user_has_messages(user_uuid uuid)
      RETURNS boolean
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      DECLARE
        message_count integer;
      BEGIN
        SELECT COUNT(*) INTO message_count
        FROM public.session_messages
        WHERE sender_id = user_uuid OR recipient_id = user_uuid;
        
        RETURN message_count > 0;
      END;
      $$;
      `,
      
      // Grant execute permissions for user_has_messages
      `
      GRANT EXECUTE ON FUNCTION user_has_messages(uuid) TO authenticated;
      GRANT EXECUTE ON FUNCTION user_has_messages(uuid) TO anon;
      `,
      
      // Create user_has_sessions function
      `
      CREATE OR REPLACE FUNCTION user_has_sessions(user_uuid uuid)
      RETURNS boolean
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      DECLARE
        session_count integer;
      BEGIN
        SELECT COUNT(*) INTO session_count
        FROM public.counseling_sessions
        WHERE counselor_id = user_uuid OR patient_id = user_uuid;
        
        RETURN session_count > 0;
      END;
      $$;
      `,
      
      // Grant execute permissions for user_has_sessions
      `
      GRANT EXECUTE ON FUNCTION user_has_sessions(uuid) TO authenticated;
      GRANT EXECUTE ON FUNCTION user_has_sessions(uuid) TO anon;
      `,
      
      // Create get_all_messages function
      `
      CREATE OR REPLACE FUNCTION get_all_messages()
      RETURNS TABLE (
        id uuid,
        session_id uuid,
        sender_id uuid,
        recipient_id uuid,
        message text,
        is_read boolean,
        created_at timestamptz,
        sender_name text,
        recipient_name text
      )
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      BEGIN
        RETURN QUERY
        SELECT 
          sm.id,
          sm.session_id,
          sm.sender_id,
          sm.recipient_id,
          sm.message,
          sm.is_read,
          sm.created_at,
          sender.display_name as sender_name,
          recipient.display_name as recipient_name
        FROM 
          public.session_messages sm
        JOIN 
          public.user_profiles sender ON sm.sender_id = sender.id
        JOIN 
          public.user_profiles recipient ON sm.recipient_id = recipient.id
        ORDER BY 
          sm.created_at DESC;
      END;
      $$;
      `,
      
      // Grant execute permissions for get_all_messages
      `
      GRANT EXECUTE ON FUNCTION get_all_messages() TO authenticated;
      GRANT EXECUTE ON FUNCTION get_all_messages() TO anon;
      `,
      
      // Create a policy to allow all users to see all messages (for testing)
      `
      DROP POLICY IF EXISTS "All users can see all messages" ON public.session_messages;
      CREATE POLICY "All users can see all messages"
      ON public.session_messages
      FOR SELECT
      USING (true);
      `
    ];
    
    // Execute each SQL command
    const results = [];
    for (const sql of sqlCommands) {
      try {
        const { data, error } = await supabase.rpc('exec_sql', { sql });
        
        if (error) {
          console.error('Error executing SQL:', error);
          results.push({ success: false, error: error.message, sql: sql.trim().substring(0, 100) + '...' });
        } else {
          results.push({ success: true, sql: sql.trim().substring(0, 100) + '...' });
        }
      } catch (err) {
        console.error('Error executing SQL:', err);
        results.push({ success: false, error: err.message, sql: sql.trim().substring(0, 100) + '...' });
      }
    }
    
    // Check if all messages table has RLS policies
    const { data: policies, error: policiesError } = await supabase.rpc('exec_sql', { 
      sql: `SELECT * FROM pg_policies WHERE tablename = 'session_messages';` 
    });
    
    return NextResponse.json({
      success: true,
      results,
      policies,
      policiesError: policiesError ? policiesError.message : null,
      message: 'SQL commands executed. Check the results for any errors.'
    });
  } catch (error) {
    console.error('Error in fix messages API:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
