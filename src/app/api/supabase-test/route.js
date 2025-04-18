import { NextResponse } from 'next/server';
import { supabase, testSupabaseConnection } from '@/utils/supabaseClient';

export const dynamic = 'force-dynamic'; // This ensures the route is always dynamic

export async function GET() {
  try {
    console.log('API: Testing Supabase connection...');

    // Test the connection
    const connectionTest = await testSupabaseConnection();
    console.log('API: Connection test result:', connectionTest);

    if (!connectionTest.success) {
      console.error('API: Connection test failed:', connectionTest.error);
      return NextResponse.json({
        success: false,
        message: 'Connection failed',
        error: connectionTest.error?.message || 'Failed to connect to Supabase',
        details: connectionTest.details || {},
        debug: {
          url: process.env.NEXT_PUBLIC_SUPABASE_URL || 'Not set in env',
          keyLength: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.length : 0,
          nodeEnv: process.env.NODE_ENV,
        }
      }, { status: 500 });
    }

    console.log('API: Connection successful, getting tables...');

    // Check for tables we know exist
    const knownTables = [
      'user_profiles',
      'counselor_applications',
      'mental_health_checkins',
      'counseling_sessions',
      'discussion_posts',
      'discussion_comments',
      'educational_contents',
      'inspirational_quotes',
      'auth_users'
    ];

    // Verify each table exists
    const tables = [];
    for (const tableName of knownTables) {
      try {
        console.log(`API: Checking if table ${tableName} exists...`);
        const { error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);

        if (!error || error.code !== '42P01') { // 42P01 is the code for table doesn't exist
          console.log(`API: Table ${tableName} exists`);
          tables.push(tableName);
        } else {
          console.log(`API: Table ${tableName} does not exist:`, error);
        }
      } catch (e) {
        console.error(`API: Error checking table ${tableName}:`, e);
      }
    }
    console.log('API: Tables found:', tables);

    // Get Supabase version
    let versionData = null;
    try {
      const { data, error } = await supabase.rpc('version');
      if (error) {
        console.error('API: Error getting Supabase version:', error);
      } else {
        versionData = data;
        console.log('API: Supabase version:', versionData);
      }
    } catch (versionError) {
      console.error('API: Exception getting version:', versionError);
    }

    // Get database connection info
    let connectionInfo = null;
    try {
      const { data, error } = await supabase.rpc('get_connection_info');
      if (error) {
        console.error('API: Error getting connection info:', error);
      } else {
        connectionInfo = data;
        console.log('API: Connection info:', connectionInfo);
      }
    } catch (connectionInfoError) {
      console.error('API: Exception getting connection info:', connectionInfoError);
    }

    // Get server time
    const now = new Date().toISOString();

    return NextResponse.json({
      success: true,
      message: 'Connected to Supabase',
      serverTime: connectionTest.data?.[0]?.now || now,
      tables,
      version: versionData || 'Unknown',
      connectionInfo: connectionInfo || {},
      environment: {
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || 'Not set in env',
        supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set (length: ' + process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.length + ')' : 'Not set',
        nodeEnv: process.env.NODE_ENV,
      }
    });
  } catch (error) {
    console.error('API: Error in Supabase test API:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Unknown error',
      message: 'Failed to test Supabase connection',
      stack: error.stack
    }, { status: 500 });
  }
}
