import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    // Initialize Supabase client
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    console.log('CREATE TABLE: Starting table creation');
    
    // First check if the table already exists
    const checkSql = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'session_messages'
      );
    `;
    
    const { data: tableExists, error: checkError } = await supabase.rpc('exec_sql', {
      sql: checkSql
    });
    
    if (checkError) {
      console.error('CREATE TABLE: Error checking if table exists:', checkError);
      return NextResponse.json({
        success: false,
        error: 'Error checking if table exists',
        details: checkError.message
      }, { status: 500 });
    }
    
    console.log('CREATE TABLE: Table exists check result:', tableExists);
    
    // If table already exists, return success
    if (tableExists && tableExists[0] && tableExists[0].exists) {
      console.log('CREATE TABLE: Table already exists');
      return NextResponse.json({
        success: true,
        message: 'Table already exists',
        created: false
      });
    }
    
    // Create the table
    const createSql = `
      CREATE TABLE public.session_messages (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        session_id uuid NOT NULL,
        sender_id uuid NOT NULL,
        recipient_id uuid NOT NULL,
        message text NOT NULL,
        is_read boolean NOT NULL DEFAULT false,
        created_at timestamp with time zone NOT NULL DEFAULT now(),
        updated_at timestamp with time zone NOT NULL DEFAULT now()
      );
      
      ALTER TABLE public.session_messages DISABLE ROW LEVEL SECURITY;
    `;
    
    const { error: createError } = await supabase.rpc('exec_sql', {
      sql: createSql
    });
    
    if (createError) {
      console.error('CREATE TABLE: Error creating table:', createError);
      return NextResponse.json({
        success: false,
        error: 'Error creating table',
        details: createError.message
      }, { status: 500 });
    }
    
    console.log('CREATE TABLE: Table created successfully');
    
    // Verify the table was created
    const verifySql = `
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'session_messages' AND table_schema = 'public';
    `;
    
    const { data: verifyData, error: verifyError } = await supabase.rpc('exec_sql', {
      sql: verifySql
    });
    
    if (verifyError) {
      console.error('CREATE TABLE: Error verifying table:', verifyError);
      return NextResponse.json({
        success: true,
        message: 'Table created but verification failed',
        created: true,
        verifyError: verifyError.message
      });
    }
    
    console.log('CREATE TABLE: Table verification:', verifyData);
    
    return NextResponse.json({
      success: true,
      message: 'Table created successfully',
      created: true,
      structure: verifyData
    });
  } catch (error) {
    console.error('CREATE TABLE: Unexpected error:', error);
    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred',
      details: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
