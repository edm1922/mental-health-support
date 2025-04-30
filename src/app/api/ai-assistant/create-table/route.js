import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    // Initialize Supabase client
    const supabase = createRouteHandlerClient({ cookies });
    
    console.log('Creating ai_assistant_conversations table...');
    
    // Check if the table exists
    const { data: tableExists, error: checkError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_name', 'ai_assistant_conversations')
      .eq('table_schema', 'public')
      .single();
    
    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking if table exists:', checkError);
      return NextResponse.json({
        success: false,
        error: 'Failed to check if table exists',
        details: checkError.message
      }, { status: 500 });
    }
    
    // If table already exists, just return success
    if (tableExists) {
      console.log('Table already exists');
      return NextResponse.json({
        success: true,
        message: 'Table already exists'
      });
    }
    
    // Create the table
    const createSql = `
      CREATE TABLE public.ai_assistant_conversations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        message TEXT NOT NULL,
        response TEXT NOT NULL,
        emotion_detected TEXT,
        sentiment_score FLOAT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      
      -- Create index for faster queries
      CREATE INDEX idx_ai_assistant_conversations_user_id ON public.ai_assistant_conversations(user_id);
      
      -- Disable RLS initially for easier development
      ALTER TABLE public.ai_assistant_conversations DISABLE ROW LEVEL SECURITY;
    `;
    
    const { error: createError } = await supabase.rpc('exec_sql', {
      sql: createSql
    });
    
    if (createError) {
      console.error('Error creating table:', createError);
      return NextResponse.json({
        success: false,
        error: 'Failed to create table',
        details: createError.message
      }, { status: 500 });
    }
    
    console.log('Table created successfully');
    return NextResponse.json({
      success: true,
      message: 'Table created successfully'
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred',
      details: error.message
    }, { status: 500 });
  }
}
