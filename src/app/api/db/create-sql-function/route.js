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
    
    console.log('Creating SQL execution function...');
    
    // Create the SQL execution function
    const { data, error } = await adminSupabase.rpc('exec_sql', {
      sql: `
        CREATE OR REPLACE FUNCTION public.exec_sql(sql text)
        RETURNS void
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $$
        BEGIN
          EXECUTE sql;
        END;
        $$;
        
        GRANT EXECUTE ON FUNCTION public.exec_sql(text) TO authenticated;
        GRANT EXECUTE ON FUNCTION public.exec_sql(text) TO anon;
        GRANT EXECUTE ON FUNCTION public.exec_sql(text) TO service_role;
      `
    }).catch(err => {
      // If the function doesn't exist yet, create it directly
      return adminSupabase.from('_temp_create_function').select().limit(1).then(() => {
        return { error: { message: 'Function does not exist yet, creating directly' } };
      });
    });
    
    if (error) {
      console.log('Error or function does not exist yet, creating directly:', error);
      
      // Create the function directly
      const { data: directData, error: directError } = await adminSupabase
        .from('_temp_create_function')
        .select()
        .limit(1)
        .then(async () => {
          const { data: sqlData, error: sqlError } = await adminSupabase.rpc('exec_sql', {
            sql: `
              CREATE OR REPLACE FUNCTION public.exec_sql(sql text)
              RETURNS void
              LANGUAGE plpgsql
              SECURITY DEFINER
              AS $$
              BEGIN
                EXECUTE sql;
              END;
              $$;
              
              GRANT EXECUTE ON FUNCTION public.exec_sql(text) TO authenticated;
              GRANT EXECUTE ON FUNCTION public.exec_sql(text) TO anon;
              GRANT EXECUTE ON FUNCTION public.exec_sql(text) TO service_role;
            `
          });
          
          return { data: sqlData, error: sqlError };
        })
        .catch(async (err) => {
          // If the table doesn't exist, try direct SQL
          console.log('Table does not exist, trying direct SQL execution');
          
          // Try to execute SQL directly
          const { data: directSqlData, error: directSqlError } = await adminSupabase.rpc('exec_sql', {
            sql: `
              CREATE OR REPLACE FUNCTION public.exec_sql(sql text)
              RETURNS void
              LANGUAGE plpgsql
              SECURITY DEFINER
              AS $$
              BEGIN
                EXECUTE sql;
              END;
              $$;
              
              GRANT EXECUTE ON FUNCTION public.exec_sql(text) TO authenticated;
              GRANT EXECUTE ON FUNCTION public.exec_sql(text) TO anon;
              GRANT EXECUTE ON FUNCTION public.exec_sql(text) TO service_role;
            `
          });
          
          return { data: directSqlData, error: directSqlError };
        });
      
      if (directError) {
        console.log('Error creating function directly:', directError);
        return NextResponse.json({
          success: false,
          error: 'Failed to create SQL execution function',
          details: directError.message
        }, { status: 500 });
      }
      
      console.log('Function created directly');
      return NextResponse.json({
        success: true,
        message: 'SQL execution function created directly'
      });
    }
    
    console.log('Function created or already exists');
    return NextResponse.json({
      success: true,
      message: 'SQL execution function created or already exists'
    });
  } catch (error) {
    console.error('Unexpected error creating SQL function:', error);
    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred',
      details: error.message
    }, { status: 500 });
  }
}
