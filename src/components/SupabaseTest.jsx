'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabaseClient';

export default function SupabaseTest() {
  const [status, setStatus] = useState('Checking connection...');
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [initStatus, setInitStatus] = useState(null);
  const [initLoading, setInitLoading] = useState(false);

  useEffect(() => {
    async function testConnection() {
      try {
        setLoading(true);
        console.log('Testing Supabase connection from client...');

        // First try a direct test using the client
        try {
          console.log('Direct test: Attempting to query pg_tables...');
          const { data: directData, error: directError } = await supabase
            .from('pg_tables')
            .select('tablename')
            .limit(1);

          if (directError) {
            console.error('Direct client test failed:', directError);
          } else {
            console.log('Direct client test succeeded:', directData);
          }
        } catch (directTestError) {
          console.error('Direct client test exception:', directTestError);
        }

        // Call the API endpoint to test the connection
        console.log('API test: Calling /api/supabase-test endpoint...');
        const response = await fetch('/api/supabase-test');
        const result = await response.json();
        console.log('API test result:', result);

        if (!result.success) {
          throw new Error(result.error || result.message || 'Connection failed');
        }

        setStatus('Connected to Supabase!');
        setData({
          serverTime: result.serverTime,
          version: result.version,
        });
        setTables(result.tables || []);
      } catch (error) {
        console.error('Supabase connection error:', error);
        setStatus('Connection failed');
        setError(error.message || 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    testConnection();
  }, []);

  const initializeDatabase = async () => {
    try {
      setInitLoading(true);
      setInitStatus(null);

      // Create tables directly using SQL
      const createTablesSql = `
        -- Create user_profiles table
        CREATE TABLE IF NOT EXISTS public.user_profiles (
          id UUID PRIMARY KEY,
          display_name TEXT,
          bio TEXT,
          image_url TEXT,
          role TEXT DEFAULT 'user',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Create counselor_applications table
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

        -- Create mental_health_checkins table
        CREATE TABLE IF NOT EXISTS public.mental_health_checkins (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID,
          mood_rating INTEGER NOT NULL,
          notes TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Create counseling_sessions table
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

        -- Create community_posts table
        CREATE TABLE IF NOT EXISTS public.community_posts (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID,
          title TEXT NOT NULL,
          content TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `;

      const response = await fetch('/api/sql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sql: createTablesSql }),
      });

      const result = await response.json();

      if (result.success) {
        // Refresh the list of tables
        const refreshResponse = await fetch('/api/supabase-test');
        const refreshResult = await refreshResponse.json();

        if (refreshResult.success) {
          setTables(refreshResult.tables || []);
        }

        setInitStatus({
          success: true,
          message: 'Database initialized successfully',
          details: [
            { table: 'user_profiles', success: true },
            { table: 'counselor_applications', success: true },
            { table: 'mental_health_checkins', success: true },
            { table: 'counseling_sessions', success: true },
            { table: 'community_posts', success: true }
          ]
        });
      } else {
        setInitStatus({
          success: false,
          message: 'Database initialization failed',
          error: result.error,
          details: [
            { table: 'all tables', success: false, error: result.error }
          ]
        });
      }
    } catch (error) {
      console.error('Error initializing database:', error);
      setInitStatus({
        success: false,
        error: error.message || 'Unknown error',
        message: 'Failed to initialize database',
      });
    } finally {
      setInitLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg bg-white shadow-sm">
      <h2 className="text-xl font-semibold mb-2">Supabase Connection Test</h2>

      {loading ? (
        <div className="flex justify-center items-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          <div className="mb-2">
            <span className="font-medium">Status: </span>
            <span className={status.includes('Connected') ? 'text-green-600' : status.includes('Checking') ? 'text-yellow-600' : 'text-red-600'}>
              {status}
            </span>
          </div>

          {error && (
            <div className="mb-2 text-red-600">
              <span className="font-medium">Error: </span>
              {error}
            </div>
          )}

          {data && (
            <div className="space-y-2 mb-4">
              <div>
                <span className="font-medium">Server time: </span>
                {new Date(data.serverTime).toLocaleString()}
              </div>

              {data.version && (
                <div>
                  <span className="font-medium">Supabase version: </span>
                  {data.version}
                </div>
              )}
            </div>
          )}

          {tables.length > 0 && (
            <div className="mb-4">
              <h3 className="font-medium mb-2">Available Tables:</h3>
              <ul className="list-disc pl-5 space-y-1">
                {tables.map(table => (
                  <li key={table} className="text-sm">{table}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-6 border-t pt-4">
            <h3 className="font-medium mb-2">Database Initialization</h3>
            <p className="text-sm text-gray-600 mb-3">
              Initialize the database schema if tables don't exist.
            </p>

            <button
              onClick={initializeDatabase}
              disabled={initLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {initLoading ? 'Initializing...' : 'Initialize Database'}
            </button>

            {initStatus && (
              <div className={`mt-3 p-3 rounded ${initStatus.success ? 'bg-green-50' : 'bg-red-50'}`}>
                <p className={initStatus.success ? 'text-green-700' : 'text-red-700'}>
                  {initStatus.message}
                </p>

                {initStatus.details && (
                  <div className="mt-2">
                    <h4 className="font-medium text-sm">Details:</h4>
                    <ul className="list-disc pl-5 mt-1 text-sm">
                      {initStatus.details.map((detail, index) => (
                        <li key={index} className={detail.success ? 'text-green-600' : 'text-red-600'}>
                          {detail.table}: {detail.success ? 'Success' : `Failed - ${detail.error}`}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="mt-4 text-sm text-gray-600">
            <p>If connected, you should see the current server time and available tables from Supabase.</p>
            <p>If not connected, check your environment variables and network connection.</p>
          </div>
        </>
      )}
    </div>
  );
}
