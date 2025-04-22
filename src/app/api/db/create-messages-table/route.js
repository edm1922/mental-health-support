import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

// Create a direct Supabase client with admin privileges
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://euebogudyyeodzkvhyef.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV1ZWJvZ3VkeXllb2R6a3ZoeWVmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcwMDAwMDAwMCwiZXhwIjoyMDAwMDAwMDAwfQ.Oi-qM8JYuQIXEf0sMVfQTcwzBBwu3iLLFfVnQNvl8Vc';

export async function POST(request) {
  try {
    // Create a fresh Supabase client for each request
    const adminSupabase = createClient(supabaseUrl, supabaseServiceKey);
    
    console.log('Creating session_messages table if it does not exist...');
    
    // First ensure the SQL execution function exists
    try {
      // Try to create the function first
      await fetch('/api/db/create-sql-function', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      console.log('SQL function creation requested');
    } catch (fnError) {
      console.log('Error requesting SQL function creation:', fnError);
      // Continue anyway
    }
    
    // Check if the table exists
    const { data: tableExists, error: checkError } = await adminSupabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_name', 'session_messages')
      .eq('table_schema', 'public')
      .single();
      
    if (checkError || !tableExists) {
      console.log('Table does not exist, creating it...');
      
      // Create the table
      const { data: createResult, error: createError } = await adminSupabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS public.session_messages (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            session_id UUID NOT NULL REFERENCES public.counseling_sessions(id) ON DELETE CASCADE,
            sender_id UUID NOT NULL,
            message_text TEXT NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            is_read BOOLEAN DEFAULT FALSE
          );
          
          -- Add indexes
          CREATE INDEX IF NOT EXISTS idx_session_messages_session_id ON public.session_messages(session_id);
          CREATE INDEX IF NOT EXISTS idx_session_messages_sender_id ON public.session_messages(sender_id);
          
          -- Add RLS policies
          ALTER TABLE public.session_messages ENABLE ROW LEVEL SECURITY;
          
          -- Allow users to view messages in their own sessions
          DROP POLICY IF EXISTS "Users can view their own session messages" ON public.session_messages;
          CREATE POLICY "Users can view their own session messages" 
            ON public.session_messages
            FOR SELECT
            USING (
              EXISTS (
                SELECT 1 FROM public.counseling_sessions cs
                WHERE cs.id = session_messages.session_id
                AND (cs.patient_id = auth.uid() OR cs.counselor_id = auth.uid())
              )
            );
          
          -- Allow users to insert messages in their own sessions
          DROP POLICY IF EXISTS "Users can insert messages" ON public.session_messages;
          CREATE POLICY "Users can insert messages" 
            ON public.session_messages
            FOR INSERT
            WITH CHECK (
              sender_id = auth.uid() AND
              EXISTS (
                SELECT 1 FROM public.counseling_sessions cs
                WHERE cs.id = session_messages.session_id
                AND (cs.patient_id = auth.uid() OR cs.counselor_id = auth.uid())
              )
            );
          
          -- Allow users to update read status of their own messages
          DROP POLICY IF EXISTS "Users can update read status" ON public.session_messages;
          CREATE POLICY "Users can update read status" 
            ON public.session_messages
            FOR UPDATE
            USING (
              EXISTS (
                SELECT 1 FROM public.counseling_sessions cs
                WHERE cs.id = session_messages.session_id
                AND (cs.patient_id = auth.uid() OR cs.counselor_id = auth.uid())
              )
            )
            WITH CHECK (
              EXISTS (
                SELECT 1 FROM public.counseling_sessions cs
                WHERE cs.id = session_messages.session_id
                AND (cs.patient_id = auth.uid() OR cs.counselor_id = auth.uid())
              )
            );
        `
      });
      
      if (createError) {
        console.log('Error creating table:', createError);
        return NextResponse.json({
          success: false,
          error: 'Failed to create session_messages table',
          details: createError.message
        }, { status: 500 });
      }
      
      console.log('Table created successfully');
      return NextResponse.json({
        success: true,
        message: 'session_messages table created successfully'
      });
    }
    
    console.log('Table already exists');
    return NextResponse.json({
      success: true,
      message: 'session_messages table already exists'
    });
  } catch (error) {
    console.error('Unexpected error creating table:', error);
    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred',
      details: error.message
    }, { status: 500 });
  }
}
