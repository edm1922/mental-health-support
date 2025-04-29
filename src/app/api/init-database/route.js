import { NextResponse } from 'next/server';
import { supabase } from '@/utils/supabaseClient';

export const dynamic = 'force-dynamic'; // This ensures the route is always dynamic

export async function POST() {
  try {
    // Check if we can connect to the database
    console.log('Checking database connection...');
    const { data: connectionTest, error: connectionError } = await supabase
      .from('pg_tables')
      .select('tablename')
      .limit(1);

    if (connectionError) {
      console.error('Connection error:', connectionError);
      return NextResponse.json({
        success: false,
        error: connectionError.message,
        message: 'Failed to connect to Supabase'
      }, { status: 500 });
    }

    console.log('Connection successful, getting table list...');

    // Get list of tables in the public schema
    const { data: tableList, error: tableListError } = await supabase
      .from('pg_tables')
      .select('tablename')
      .eq('schemaname', 'public');

    if (tableListError) {
      console.error('Error fetching tables:', tableListError);
      return NextResponse.json({
        success: false,
        error: tableListError.message,
        message: 'Failed to fetch existing tables'
      }, { status: 500 });
    }

    const existingTables = tableList ? tableList.map(t => t.tablename) : [];
    console.log('Existing tables:', existingTables);

    const requiredTables = [
      'user_profiles',
      'counselor_applications',
      'mental_health_checkins',
      'counseling_sessions',
      'community_posts'
    ];

    const missingTables = requiredTables.filter(table => !existingTables.includes(table));
    console.log('Missing tables:', missingTables);

    if (missingTables.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Database schema is already initialized',
        initialized: false
      });
    }

    // Check if exec_sql function exists
    console.log('Checking if exec_sql function exists...');
    const { error: execSqlError } = await supabase.rpc('exec_sql', { sql: 'SELECT 1' });

    if (execSqlError) {
      console.error('exec_sql function not available:', execSqlError);
      return NextResponse.json({
        success: false,
        error: 'The exec_sql function is not available in your Supabase project',
        message: 'Please run the SQL function setup script in the Supabase SQL Editor',
        details: [
          {
            table: 'all tables',
            success: false,
            error: 'Missing exec_sql function'
          }
        ]
      }, { status: 500 });
    }

    console.log('exec_sql function available, creating tables...');

    // Create missing tables using direct SQL
    const results = [];

    // Create tables one by one
    for (const tableName of missingTables) {
      let sql = '';

      switch (tableName) {
        case 'user_profiles':
          sql = `
            CREATE TABLE IF NOT EXISTS public.user_profiles (
              id UUID PRIMARY KEY,
              display_name TEXT,
              bio TEXT,
              image_url TEXT,
              role TEXT DEFAULT 'user',
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
          `;
          break;

        case 'counselor_applications':
          sql = `
            CREATE TABLE IF NOT EXISTS public.counselor_applications (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              user_id UUID,
              credentials TEXT NOT NULL,
              years_experience INTEGER NOT NULL,
              specializations TEXT NOT NULL,
              summary TEXT NOT NULL,
              license_url TEXT,
              status TEXT DEFAULT 'pending',
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
          `;
          break;

        case 'mental_health_checkins':
          sql = `
            CREATE TABLE IF NOT EXISTS public.mental_health_checkins (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              user_id UUID,
              mood_rating INTEGER NOT NULL,
              notes TEXT,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
          `;
          break;

        case 'counseling_sessions':
          sql = `
            CREATE TABLE IF NOT EXISTS public.counseling_sessions (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              counselor_id UUID,
              client_id UUID,
              session_date TIMESTAMP WITH TIME ZONE NOT NULL,
              duration INTEGER NOT NULL,
              status TEXT DEFAULT 'scheduled',
              notes TEXT,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
          `;
          break;

        case 'community_posts':
          sql = `
            CREATE TABLE IF NOT EXISTS public.community_posts (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              user_id UUID,
              title TEXT NOT NULL,
              content TEXT NOT NULL,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
          `;
          break;
      }

      console.log(`Creating ${tableName} table...`);

      // Execute the SQL
      const { error } = await supabase.rpc('exec_sql', { sql });

      if (error) {
        console.error(`Error creating ${tableName} table:`, error);
        results.push({
          table: tableName,
          success: false,
          error: error.message
        });
      } else {
        console.log(`${tableName} table created successfully`);
        results.push({
          table: tableName,
          success: true
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    return NextResponse.json({
      success: failureCount === 0,
      message: `Database initialization ${failureCount === 0 ? 'completed successfully' : 'completed with errors'}`,
      details: results,
      initialized: true,
      stats: {
        total: results.length,
        success: successCount,
        failure: failureCount
      }
    });
  } catch (error) {
    console.error('Error in database initialization API:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Unknown error',
      message: 'Failed to initialize database'
    }, { status: 500 });
  }
}
