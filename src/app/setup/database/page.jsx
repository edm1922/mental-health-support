'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';

const DatabaseSetup = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tables, setTables] = useState([]);
  const [hasUserProfiles, setHasUserProfiles] = useState(false);
  const [creatingTables, setCreatingTables] = useState(false);
  const [createResult, setCreateResult] = useState(null);

  useEffect(() => {
    checkTables();
  }, []);

  const checkTables = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/database/check-tables');

      if (!response.ok) {
        throw new Error('Failed to check database tables');
      }

      const data = await response.json();
      setTables(data.tables || []);
      setHasUserProfiles(data.hasUserProfiles || false);
    } catch (error) {
      console.error('Error checking tables:', error);
      setError(error.message || 'An error occurred while checking database tables');
    } finally {
      setLoading(false);
    }
  };

  const createTables = async () => {
    try {
      setCreatingTables(true);
      const response = await fetch('/api/database/create-tables', {
        method: 'POST',
      });

      const data = await response.json();
      setCreateResult(data);

      if (data.success) {
        await checkTables(); // Refresh the table list
      }
    } catch (error) {
      console.error('Error creating tables:', error);
      setCreateResult({
        success: false,
        error: error.message || 'An error occurred while creating database tables'
      });
    } finally {
      setCreatingTables(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white p-6 rounded-lg shadow-md">
        <h1 className="text-3xl font-bold mb-6">Database Setup</h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <p>{error}</p>
          </div>
        )}

        {loading ? (
          <div className="text-center py-4">
            <p>Checking database tables...</p>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-2">Database Status</h2>
              <p className="mb-2">
                <span className="font-medium">Connection:</span> {error ? 'Failed' : 'Connected'}
              </p>
              <p className="mb-2">
                <span className="font-medium">Tables Found:</span> {tables.length}
              </p>
              <p className="mb-4">
                <span className="font-medium">user_profiles Table:</span>{' '}
                {hasUserProfiles ? (
                  <span className="text-green-600">Exists</span>
                ) : (
                  <span className="text-red-600">Missing</span>
                )}
              </p>

              {tables.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-lg font-medium mb-2">Existing Tables:</h3>
                  <ul className="list-disc pl-5">
                    {tables.map((table) => (
                      <li key={table}>{table}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {!hasUserProfiles && (
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-2">Create Required Tables</h2>
                <p className="mb-4">
                  The <code className="bg-gray-100 px-1 py-0.5 rounded">user_profiles</code> table is required for user registration.
                </p>

                <button
                  onClick={createTables}
                  disabled={creatingTables}
                  className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {creatingTables ? 'Creating Tables...' : 'Create Tables'}
                </button>
              </div>
            )}

            {createResult && (
              <div className={`mb-6 p-4 rounded ${createResult.success ? 'bg-green-100' : 'bg-red-100'}`}>
                <h3 className="font-medium mb-2">
                  {createResult.success ? 'Tables Created Successfully' : 'Error Creating Tables'}
                </h3>
                <p>{createResult.message}</p>

                {!createResult.success && createResult.sql && (
                  <div className="mt-4">
                    <h4 className="font-medium mb-2">SQL to Run in Supabase Dashboard:</h4>
                    <pre className="bg-gray-800 text-white p-4 rounded overflow-x-auto text-sm">
                      {createResult.sql}
                    </pre>
                  </div>
                )}
              </div>
            )}

            <div className="mt-8 border-t pt-6">
              <h2 className="text-xl font-semibold mb-4">Manual Setup Instructions</h2>
              <p className="mb-4">
                If automatic table creation fails, you can manually create the required tables in the Supabase dashboard:
              </p>

              <ol className="list-decimal pl-5 mb-6 space-y-2">
                <li>Go to your Supabase project dashboard</li>
                <li>Navigate to the SQL Editor</li>
                <li>Create a new query</li>
                <li>Paste and run the following SQL:</li>
              </ol>

              <pre className="bg-gray-800 text-white p-4 rounded overflow-x-auto text-sm mb-6">
{`-- Create user_profiles table
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY,
  display_name TEXT,
  bio TEXT,
  image_url TEXT,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Drop the existing exec_sql function first
DROP FUNCTION IF EXISTS exec_sql(text);

-- Create RPC function for executing SQL (optional but recommended)
CREATE OR REPLACE FUNCTION exec_sql(sql text)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE sql;
  RETURN jsonb_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'detail', SQLSTATE
  );
END;
$$;`}
              </pre>
            </div>

            <div className="flex justify-between mt-8 pt-6 border-t">
              <Link href="/" className="text-blue-600 hover:underline">
                Back to Home
              </Link>

              <Link href="/account/signup" className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700">
                Go to Sign Up
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DatabaseSetup;
