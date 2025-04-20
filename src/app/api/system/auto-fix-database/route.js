import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { autoFixDatabaseSchema } from '@/utils/databaseMigrations';

export const dynamic = 'force-dynamic';

/**
 * API endpoint to automatically fix database schema issues
 * This can be called on application startup or when issues are detected
 */
export async function POST(request) {
  try {
    // Initialize Supabase client
    const supabase = createRouteHandlerClient({ cookies });

    // Get the session if available (not required for this operation)
    const { data: { session } } = await supabase.auth.getSession();
    
    // Run the automatic database fix
    console.log('Running automatic database fix...');
    const fixResults = await autoFixDatabaseSchema();
    
    return NextResponse.json({
      success: fixResults.success,
      message: fixResults.message,
      operations: fixResults.operations,
      errors: fixResults.errors
    });
  } catch (error) {
    console.error('Error in auto-fix-database API:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error: ' + error.message 
      },
      { status: 500 }
    );
  }
}
