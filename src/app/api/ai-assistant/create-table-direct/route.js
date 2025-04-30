import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

// Create a direct Supabase client with admin privileges
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const adminSupabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request) {
  try {
    console.log('Creating ai_assistant_conversations table directly...');
    
    // Read the SQL file
    const sqlFilePath = path.join(process.cwd(), 'src', 'sql', 'create_ai_assistant_conversations_table.sql');
    let sqlContent;
    
    try {
      sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    } catch (readError) {
      console.error('Error reading SQL file:', readError);
      
      // Fallback to hardcoded SQL
      sqlContent = `
        DO $$
        BEGIN
          -- Check if the table already exists
          IF NOT EXISTS (
            SELECT FROM pg_tables
            WHERE schemaname = 'public'
            AND tablename = 'ai_assistant_conversations'
          ) THEN
            -- Create the table
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

            RAISE NOTICE 'Created ai_assistant_conversations table';
          ELSE
            RAISE NOTICE 'ai_assistant_conversations table already exists';
          END IF;
        END $$;
      `;
    }
    
    // Execute the SQL
    const { error } = await adminSupabase.rpc('exec_sql', {
      sql: sqlContent
    });
    
    if (error) {
      console.error('Error executing SQL:', error);
      
      // Try a simpler approach
      const simpleSql = `
        CREATE TABLE IF NOT EXISTS public.ai_assistant_conversations (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL,
          message TEXT NOT NULL,
          response TEXT NOT NULL,
          emotion_detected TEXT,
          sentiment_score FLOAT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Disable RLS initially for easier development
        ALTER TABLE public.ai_assistant_conversations DISABLE ROW LEVEL SECURITY;
      `;
      
      const { error: simpleError } = await adminSupabase.rpc('exec_sql', {
        sql: simpleSql
      });
      
      if (simpleError) {
        console.error('Error with simple SQL approach:', simpleError);
        return NextResponse.json({
          success: false,
          error: 'Failed to create table',
          details: error.message,
          simple_error: simpleError.message
        }, { status: 500 });
      }
    }
    
    // Verify the table was created
    const { data, error: verifyError } = await adminSupabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_name', 'ai_assistant_conversations')
      .eq('table_schema', 'public')
      .single();
    
    if (verifyError) {
      console.error('Error verifying table creation:', verifyError);
      return NextResponse.json({
        success: false,
        error: 'Failed to verify table creation',
        details: verifyError.message
      }, { status: 500 });
    }
    
    if (!data) {
      return NextResponse.json({
        success: false,
        error: 'Table was not created successfully'
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
