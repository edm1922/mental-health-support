import { createClient } from '@supabase/supabase-js';

// Get the values from environment variables or use hardcoded values for development
let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://euebogudyyeodzkvhyef.supabase.co';
let supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV1ZWJvZ3VkeXllb2R6a3ZoeWVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4NjM5NDgsImV4cCI6MjA2MDQzOTk0OH0.b68JOxrpuFwWb2K3DraYvv32uqomvK0r1imbOCG0HKc';

// Make sure the URL has the correct format
if (supabaseUrl && !supabaseUrl.startsWith('https://')) {
  supabaseUrl = 'https://' + supabaseUrl;
}
if (supabaseUrl && !supabaseUrl.endsWith('.supabase.co') && !supabaseUrl.includes('.supabase.co/')) {
  supabaseUrl = supabaseUrl + '.supabase.co';
}

// Log the values for debugging
console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Anon Key:', supabaseAnonKey.substring(0, 10) + '...');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase URL or Anonymous Key is missing.');
}

// Create a single supabase client for interacting with your database
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'supabase.auth.token',
    storage: {
      getItem: (key) => {
        if (typeof window === 'undefined') return null;
        const value = localStorage.getItem(key);
        console.log(`Getting auth from storage: ${key} = ${value ? 'exists' : 'not found'}`);
        return value;
      },
      setItem: (key, value) => {
        if (typeof window === 'undefined') return;
        console.log(`Setting auth in storage: ${key}`);
        localStorage.setItem(key, value);
      },
      removeItem: (key) => {
        if (typeof window === 'undefined') return;
        console.log(`Removing auth from storage: ${key}`);
        localStorage.removeItem(key);
      },
    },
  },
  realtime: {
    timeout: 30000, // 30 seconds
  },
  global: {
    headers: {
      'x-application-name': 'createxyz-project',
    },
  },
  debug: true,
});

// Test function to verify connection
export async function testSupabaseConnection() {
  try {
    console.log('Testing Supabase connection...');
    console.log('Using URL:', supabaseUrl);
    console.log('Using Key (first 10 chars):', supabaseAnonKey.substring(0, 10) + '...');

    // Try a simple auth check first - this should always work
    console.log('Attempting to get auth config...');
    const { data: authData, error: authError } = await supabase.auth.getSession();

    if (authError) {
      console.error('Auth check failed:', authError);
      return {
        success: false,
        error: authError,
        details: {
          message: 'Auth check failed - connection issue',
          authError
        }
      };
    }

    console.log('Auth check successful, trying to query information_schema...');

    // Try a query to user_profiles which we can see exists
    const { data, error } = await supabase
      .from('user_profiles')
      .select('id')
      .limit(1);

    if (error) {
      console.error('Information schema query error:', error);

      // Try a different query to see if it's just the table that's inaccessible
      console.log('Information schema query failed, trying a simple health check...');
      const { data: healthData, error: healthError } = await supabase.rpc('version');

      if (healthError) {
        console.error('Health check also failed:', healthError);

        // Try one more approach - a simple select
        console.log('Trying a simple SELECT query...');
        const { data: simpleData, error: simpleError } = await supabase
          .from('user_profiles')
          .select('id')
          .limit(1);

        if (simpleError && simpleError.code === '42P01') {
          // Table doesn't exist yet, but connection works
          console.log('Table does not exist yet, but connection works');
          return {
            success: true,
            data: [],
            warning: 'Tables not created yet'
          };
        } else if (simpleError) {
          console.error('Simple query also failed:', simpleError);
          return {
            success: false,
            error: simpleError,
            details: {
              message: 'All queries failed',
              originalError: error,
              healthError,
              simpleError
            }
          };
        } else {
          console.log('Simple query succeeded');
          return {
            success: true,
            data: simpleData
          };
        }
      } else {
        console.log('Health check succeeded but information schema query failed');
        return {
          success: true,
          data: healthData,
          warning: 'Information schema query failed but health check succeeded'
        };
      }
    }

    console.log('Connection successful, data:', data);

    // Try to get the version as well
    try {
      const { data: versionData, error: versionError } = await supabase.rpc('version');
      if (versionError) {
        console.log('Version check failed, but connection is working');
        return { success: true, data };
      }
      console.log('Supabase version:', versionData);
      return { success: true, data, version: versionData };
    } catch (versionError) {
      console.log('Version check failed, but connection is working');
      return { success: true, data };
    }
  } catch (error) {
    console.error('Supabase connection test exception:', error);
    return {
      success: false,
      error,
      details: {
        message: 'Exception thrown during connection test',
        stack: error.stack
      }
    };
  }
}
