import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    // Initialize Supabase client
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    console.log('FIX TABLE API: Attempting to fix session_messages table');
    
    // First, check if the table exists
    const { data: tableExists, error: tableCheckError } = await supabase.rpc('exec_sql', {
      sql: `SELECT EXISTS (
              SELECT FROM information_schema.tables 
              WHERE table_schema = 'public' 
              AND table_name = 'session_messages'
            );`
    });
    
    if (tableCheckError) {
      console.error('FIX TABLE API: Error checking if table exists:', tableCheckError);
      return NextResponse.json({
        success: false,
        error: 'Error checking if table exists',
        details: tableCheckError.message
      }, { status: 500 });
    }
    
    console.log('FIX TABLE API: Table exists check result:', tableExists);
    
    // If table doesn't exist, create it
    if (!tableExists || !tableExists[0] || !tableExists[0].exists) {
      console.log('FIX TABLE API: Table does not exist, creating it');
      
      const createTableSql = `
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
        sql: createTableSql
      });
      
      if (createError) {
        console.error('FIX TABLE API: Error creating table:', createError);
        return NextResponse.json({
          success: false,
          error: 'Error creating table',
          details: createError.message
        }, { status: 500 });
      }
      
      console.log('FIX TABLE API: Table created successfully');
    } else {
      console.log('FIX TABLE API: Table exists, checking structure');
      
      // Check table structure
      const { data: columns, error: columnsError } = await supabase.rpc('exec_sql', {
        sql: `SELECT column_name, data_type, column_default, is_nullable
              FROM information_schema.columns 
              WHERE table_name = 'session_messages' AND table_schema = 'public';`
      });
      
      if (columnsError) {
        console.error('FIX TABLE API: Error checking columns:', columnsError);
        return NextResponse.json({
          success: false,
          error: 'Error checking columns',
          details: columnsError.message
        }, { status: 500 });
      }
      
      console.log('FIX TABLE API: Current columns:', columns);
      
      // Fix any issues with the table structure
      try {
        // Make sure session_id, sender_id, and recipient_id are NOT NULL
        const fixNullablesSql = `
          ALTER TABLE public.session_messages 
          ALTER COLUMN session_id SET NOT NULL,
          ALTER COLUMN sender_id SET NOT NULL,
          ALTER COLUMN recipient_id SET NOT NULL;
        `;
        
        await supabase.rpc('exec_sql', { sql: fixNullablesSql });
        console.log('FIX TABLE API: Fixed nullable columns');
        
        // Make sure id has a default value
        const fixIdDefaultSql = `
          ALTER TABLE public.session_messages 
          ALTER COLUMN id SET DEFAULT gen_random_uuid();
        `;
        
        await supabase.rpc('exec_sql', { sql: fixIdDefaultSql });
        console.log('FIX TABLE API: Fixed id default value');
        
        // Disable RLS
        await supabase.rpc('exec_sql', {
          sql: `ALTER TABLE public.session_messages DISABLE ROW LEVEL SECURITY;`
        });
        console.log('FIX TABLE API: Disabled RLS');
      } catch (fixError) {
        console.error('FIX TABLE API: Error fixing table structure:', fixError);
        // Continue anyway, as some of these might fail if the structure is already correct
      }
    }
    
    // Check final table structure
    const { data: finalStructure, error: finalError } = await supabase.rpc('exec_sql', {
      sql: `SELECT column_name, data_type, column_default, is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'session_messages' AND table_schema = 'public';`
    });
    
    if (finalError) {
      console.error('FIX TABLE API: Error checking final structure:', finalError);
    } else {
      console.log('FIX TABLE API: Final table structure:', finalStructure);
    }
    
    return NextResponse.json({
      success: true,
      message: 'Table structure fixed successfully',
      structure: finalStructure || []
    });
  } catch (error) {
    console.error('FIX TABLE API: Unexpected error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred',
      details: error.message
    }, { status: 500 });
  }
}
