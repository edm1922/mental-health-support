import { supabase } from './supabaseClient';

/**
 * Initialize the database schema if it doesn't exist
 * @returns {Promise<Object>} Result of the initialization
 */
export async function initializeDatabase() {
  try {
    console.log('Checking database schema...');

    // Get list of tables in the public schema
    const { data: tableList, error: tableListError } = await supabase
      .from('pg_tables')
      .select('tablename')
      .eq('schemaname', 'public');

    if (tableListError) {
      console.error('Error fetching tables:', tableListError);
      return {
        success: false,
        error: tableListError.message,
        message: 'Failed to fetch existing tables'
      };
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

    if (missingTables.length === 0) {
      console.log('All required tables exist.');
      return {
        success: true,
        message: 'Database schema is already initialized',
        initialized: false
      };
    }

    console.log('Missing tables:', missingTables);

    // Create missing tables using SQL
    const results = [];

    // Create user_profiles table if it doesn't exist
    if (missingTables.includes('user_profiles')) {
      const { error: userProfilesError } = await supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS public.user_profiles (
            id UUID PRIMARY KEY REFERENCES auth.users(id),
            display_name TEXT,
            bio TEXT,
            image_url TEXT,
            role TEXT DEFAULT 'user',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `
      });

      if (userProfilesError) {
        console.error('Error creating user_profiles table:', userProfilesError);
        results.push({
          table: 'user_profiles',
          success: false,
          error: userProfilesError.message
        });
      } else {
        results.push({
          table: 'user_profiles',
          success: true
        });
      }
    }

    // Create counselor_applications table if it doesn't exist
    if (missingTables.includes('counselor_applications')) {
      const { error: applicationsError } = await supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS public.counselor_applications (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID REFERENCES auth.users(id),
            credentials TEXT NOT NULL,
            years_experience INTEGER NOT NULL,
            specializations TEXT NOT NULL,
            summary TEXT NOT NULL,
            license_url TEXT,
            status TEXT DEFAULT 'pending',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `
      });

      if (applicationsError) {
        console.error('Error creating counselor_applications table:', applicationsError);
        results.push({
          table: 'counselor_applications',
          success: false,
          error: applicationsError.message
        });
      } else {
        results.push({
          table: 'counselor_applications',
          success: true
        });
      }
    }

    // Create mental_health_checkins table if it doesn't exist
    if (missingTables.includes('mental_health_checkins')) {
      const { error: checkinsError } = await supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS public.mental_health_checkins (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID REFERENCES auth.users(id),
            mood_rating INTEGER NOT NULL,
            notes TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `
      });

      if (checkinsError) {
        console.error('Error creating mental_health_checkins table:', checkinsError);
        results.push({
          table: 'mental_health_checkins',
          success: false,
          error: checkinsError.message
        });
      } else {
        results.push({
          table: 'mental_health_checkins',
          success: true
        });
      }
    }

    // Create counseling_sessions table if it doesn't exist
    if (missingTables.includes('counseling_sessions')) {
      const { error: sessionsError } = await supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS public.counseling_sessions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            counselor_id UUID REFERENCES auth.users(id),
            client_id UUID REFERENCES auth.users(id),
            session_date TIMESTAMP WITH TIME ZONE NOT NULL,
            duration INTEGER NOT NULL,
            status TEXT DEFAULT 'scheduled',
            notes TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `
      });

      if (sessionsError) {
        console.error('Error creating counseling_sessions table:', sessionsError);
        results.push({
          table: 'counseling_sessions',
          success: false,
          error: sessionsError.message
        });
      } else {
        results.push({
          table: 'counseling_sessions',
          success: true
        });
      }
    }

    // Create community_posts table if it doesn't exist
    if (missingTables.includes('community_posts')) {
      const { error: postsError } = await supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS public.community_posts (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID REFERENCES auth.users(id),
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `
      });

      if (postsError) {
        console.error('Error creating community_posts table:', postsError);
        results.push({
          table: 'community_posts',
          success: false,
          error: postsError.message
        });
      } else {
        results.push({
          table: 'community_posts',
          success: true
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    return {
      success: failureCount === 0,
      message: `Database initialization ${failureCount === 0 ? 'completed successfully' : 'completed with errors'}`,
      details: results,
      initialized: true,
      stats: {
        total: results.length,
        success: successCount,
        failure: failureCount
      }
    };
  } catch (error) {
    console.error('Error initializing database:', error);
    return {
      success: false,
      error: error.message || 'Unknown error',
      message: 'Failed to initialize database schema'
    };
  }
}
