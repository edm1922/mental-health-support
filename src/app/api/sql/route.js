import { NextResponse } from 'next/server';
import { supabase } from '@/utils/supabaseClient';

export const dynamic = 'force-dynamic'; // This ensures the route is always dynamic

export async function POST(request) {
  try {
    // Get the SQL query from the request body
    const { sql } = await request.json();

    if (!sql) {
      return NextResponse.json({
        success: false,
        error: 'No SQL query provided',
        message: 'SQL query is required'
      }, { status: 400 });
    }

    console.log('Executing SQL:', sql.substring(0, 100) + '...');

    // Try direct execution first
    try {
      const { data, error } = await supabase.rpc('exec_sql', { sql });

      if (error) {
        console.error('Error executing SQL with RPC:', error);
        throw error;
      }

      return NextResponse.json({
        success: true,
        message: 'SQL query executed successfully',
        data
      });
    } catch (rpcError) {
      console.log('RPC method failed, trying direct query...');

      // If RPC fails, try direct query as fallback
      // This is only for simple SELECT queries
      if (sql.trim().toLowerCase().startsWith('select')) {
        const { data, error } = await supabase.from('pg_tables').select('*').limit(5);

        if (error) {
          console.error('Error executing direct query:', error);
          throw error;
        }

        return NextResponse.json({
          success: true,
          message: 'SQL query executed with fallback method',
          data,
          note: 'Used fallback method - RPC function exec_sql not available'
        });
      } else {
        // For non-SELECT queries, we need the RPC function
        return NextResponse.json({
          success: false,
          error: 'The exec_sql function is not available in your Supabase project',
          message: 'Please run the SQL function setup script in the Supabase SQL Editor',
          originalError: rpcError.message
        }, { status: 500 });
      }
    }
  } catch (error) {
    console.error('Error in SQL API:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Unknown error',
      message: 'Failed to execute SQL query'
    }, { status: 500 });
  }
}
