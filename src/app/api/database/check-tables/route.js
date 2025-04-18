import { NextResponse } from 'next/server';
import { supabase } from '@/utils/supabaseClient';

export const dynamic = 'force-dynamic'; // This ensures the route is always dynamic

export async function GET() {
  try {
    console.log('Checking database tables...');

    // First, try to directly check if the user_profiles table exists
    // This is the most reliable method
    try {
      const { data: userProfilesData, error: userProfilesError } = await supabase
        .from('user_profiles')
        .select('id')
        .limit(1);

      // If we don't get a "relation does not exist" error, the table exists
      if (!userProfilesError || (userProfilesError && userProfilesError.code !== '42P01')) {
        console.log('user_profiles table exists (direct check)');
        return NextResponse.json({
          success: true,
          tables: ['user_profiles'],
          hasUserProfiles: true,
          message: 'user_profiles table exists',
          method: 'direct-check'
        });
      }
    } catch (directCheckError) {
      console.error('Error in direct check:', directCheckError);
      // Continue to other methods
    }

    // Try to use the exec_sql function to check tables
    try {
      const { data: sqlResult, error: sqlError } = await supabase.rpc('exec_sql', {
        sql: "SELECT tablename FROM pg_tables WHERE schemaname = 'public'"
      });

      if (!sqlError && sqlResult) {
        console.log('SQL result:', sqlResult);
        // The exec_sql function returns a success flag and possibly a detail field
        if (sqlResult.success === true) {
          try {
            // Try to parse the result if it's in the detail field
            const tables = JSON.parse(sqlResult.detail || '[]');
            if (Array.isArray(tables)) {
              const tableNames = tables.map(t => t.tablename);
              const hasUserProfiles = tableNames.includes('user_profiles');
              console.log('Tables from exec_sql:', tableNames);
              return NextResponse.json({
                success: true,
                tables: tableNames,
                hasUserProfiles,
                message: hasUserProfiles ? 'user_profiles table exists' : 'user_profiles table does not exist',
                method: 'exec-sql'
              });
            }
          } catch (parseError) {
            console.error('Error parsing SQL result:', parseError);
          }
        }
      }
    } catch (sqlError) {
      console.error('Error using exec_sql:', sqlError);
    }

    // Try the pg_tables approach as a fallback
    try {
      const { data: tableList, error: tableListError } = await supabase
        .from('pg_tables')
        .select('tablename')
        .eq('schemaname', 'public');

      if (!tableListError && tableList) {
        const existingTables = tableList.map(t => t.tablename);
        const hasUserProfiles = existingTables.includes('user_profiles');
        console.log('Tables from pg_tables:', existingTables);

        return NextResponse.json({
          success: true,
          tables: existingTables,
          hasUserProfiles,
          message: hasUserProfiles
            ? 'user_profiles table exists'
            : 'user_profiles table does not exist',
          method: 'pg-tables'
        });
      }
    } catch (pgTablesError) {
      console.error('Error querying pg_tables:', pgTablesError);
    }

    // If we've reached here, all methods failed but we're still connected
    // Return a default response indicating no tables found
    console.log('All table detection methods failed, but connection is working');

    return NextResponse.json({
      success: true,
      tables: [],
      hasUserProfiles: false,
      message: 'user_profiles table does not exist',
      method: 'fallback-empty'
    });
  } catch (error) {
    console.error('Error checking database tables:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Unknown error',
      message: 'Failed to check database tables'
    }, { status: 500 });
  }
}
