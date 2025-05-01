import { createClient } from '@supabase/supabase-js';

// Get the values from environment variables or use hardcoded values for development
let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://euebogudyyeodzkvhyef.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV1ZWJvZ3VkeXllb2R6a3ZoeWVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4NjM5NDgsImV4cCI6MjA2MDQzOTk0OH0.b68JOxrpuFwWb2K3DraYvv32uqomvK0r1imbOCG0HKc';

// Make sure the URL has the correct format
if (supabaseUrl && !supabaseUrl.startsWith('https://')) {
  supabaseUrl = 'https://' + supabaseUrl;
}
if (supabaseUrl && !supabaseUrl.endsWith('.supabase.co') && !supabaseUrl.includes('.supabase.co/')) {
  supabaseUrl = supabaseUrl + '.supabase.co';
}

// Export the URL for use in other files
export { supabaseUrl, supabaseAnonKey };

// Helper function to get the storage key
export const getStorageKey = () => {
  const projectRef = supabaseUrl.includes('//')
    ? supabaseUrl.split('//')[1].split('.')[0]
    : supabaseUrl.split('.')[0];
  return `sb-${projectRef}-auth-token`;
};

// Create a single supabase client for interacting with your database
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    // Use the default storage key that Supabase expects
    storageKey: getStorageKey(),
    storage: {
      getItem: (key) => {
        if (typeof window === 'undefined') return null;

        // Try to get from localStorage first
        let value = localStorage.getItem(key);

        // If not found and it's the auth token, try the old key formats as fallback
        if (!value && key.includes('-auth-token')) {
          // Try old key formats
          const oldKeys = [
            'supabase.auth.token',
            'supabase.auth.token-code-verifier'
          ];

          for (const oldKey of oldKeys) {
            const oldValue = localStorage.getItem(oldKey);
            if (oldValue) {
              try {
                localStorage.setItem(key, oldValue);
                localStorage.removeItem(oldKey);
                value = oldValue;
                break;
              } catch (e) {
                console.error('Error migrating token:', e);
              }
            }
          }
        }

        return value;
      },
      setItem: (key, value) => {
        if (typeof window === 'undefined') return;
        try {
          localStorage.setItem(key, value);

          // Also set a cookie as a backup
          document.cookie = `${key}=${encodeURIComponent(value)};path=/;max-age=${60 * 60 * 24 * 7};SameSite=Lax`;
        } catch (e) {
          console.error('Error setting auth token:', e);
        }
      },
      removeItem: (key) => {
        if (typeof window === 'undefined') return;

        try {
          localStorage.removeItem(key);

          // Also remove the cookie
          document.cookie = `${key}=;path=/;max-age=0;SameSite=Lax`;

          // Also remove the old key formats if they exist
          if (key.includes('-auth-token')) {
            const oldKeys = [
              'supabase.auth.token',
              'supabase.auth.token-code-verifier'
            ];

            for (const oldKey of oldKeys) {
              if (localStorage.getItem(oldKey)) {
                localStorage.removeItem(oldKey);
              }
            }
          }
        } catch (e) {
          console.error('Error removing auth token:', e);
        }
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
  debug: false,
});

// Test function to verify connection
export async function testSupabaseConnection() {
  try {
    // Try a simple auth check first
    const { data: authData, error: authError } = await supabase.auth.getSession();

    if (authError) {
      return {
        success: false,
        error: authError,
        details: {
          message: 'Auth check failed - connection issue',
          authError
        }
      };
    }

    // Try a query to user_profiles
    const { data, error } = await supabase
      .from('user_profiles')
      .select('id')
      .limit(1);

    if (error) {
      // Try a different query to see if it's just the table that's inaccessible
      const { data: healthData, error: healthError } = await supabase.rpc('version');

      if (healthError) {
        // Try one more approach - a simple select
        const { data: simpleData, error: simpleError } = await supabase
          .from('user_profiles')
          .select('id')
          .limit(1);

        if (simpleError && simpleError.code === '42P01') {
          // Table doesn't exist yet, but connection works
          return {
            success: true,
            data: [],
            warning: 'Tables not created yet'
          };
        } else if (simpleError) {
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
          return {
            success: true,
            data: simpleData
          };
        }
      } else {
        return {
          success: true,
          data: healthData,
          warning: 'Information schema query failed but health check succeeded'
        };
      }
    }

    // Try to get the version as well
    try {
      const { data: versionData, error: versionError } = await supabase.rpc('version');
      if (versionError) {
        return { success: true, data };
      }
      return { success: true, data, version: versionData };
    } catch (versionError) {
      return { success: true, data };
    }
  } catch (error) {
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
