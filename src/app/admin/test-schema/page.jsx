"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/utils/supabaseClient";

export default function TestSchemaPage() {
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkSchema();
  }, []);

  const checkSchema = async () => {
    try {
      setLoading(true);
      setResult(null);
      setError(null);

      // Call the API to verify the schema
      const response = await fetch('/api/forum/verify-schema', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to verify schema');
      }

      setResult(data);

      // Also try a direct query to test the schema cache
      try {
        const { data: directData, error: directError } = await supabase
          .from('discussion_posts')
          .select('id, is_approved')
          .limit(1);

        if (directError) {
          setResult(prev => ({
            ...prev,
            directQuery: {
              success: false,
              error: directError.message
            }
          }));
        } else {
          setResult(prev => ({
            ...prev,
            directQuery: {
              success: true,
              data: directData
            }
          }));
        }
      } catch (directErr) {
        setResult(prev => ({
          ...prev,
          directQuery: {
            success: false,
            error: directErr.message
          }
        }));
      }
    } catch (err) {
      console.error('Error verifying schema:', err);
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshSchemaCache = async () => {
    try {
      setLoading(true);
      setResult(null);
      setError(null);

      // Call the API to refresh the schema cache
      const response = await fetch('/api/forum/refresh-schema-cache', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to refresh schema cache');
      }

      // Check the schema again after refreshing
      await checkSchema();
    } catch (err) {
      console.error('Error refreshing schema cache:', err);
      setError(err.message || 'An unexpected error occurred');
      setLoading(false);
    }
  };

  const handleForceSchemaRefresh = async () => {
    try {
      setLoading(true);
      setResult(null);
      setError(null);

      // Call the API to force a schema refresh
      const response = await fetch('/api/forum/force-schema-refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to force schema refresh');
      }

      // Check the schema again after forcing refresh
      await checkSchema();
    } catch (err) {
      console.error('Error forcing schema refresh:', err);
      setError(err.message || 'An unexpected error occurred');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/admin/dashboard"
            className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-gray-600 shadow-md hover:bg-gray-50"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              strokeWidth="2"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back to Admin Dashboard
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-xl p-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">Test Schema Cache</h1>

          <div className="mb-6 space-y-4">
            <p className="text-gray-600">
              This page tests whether the <code className="bg-gray-100 px-1 py-0.5 rounded">is_approved</code> column
              in the discussion_posts table is properly recognized by the Supabase client.
            </p>

            <div className="flex space-x-4">
              <button
                onClick={checkSchema}
                disabled={loading}
                className="flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Checking Schema...
                  </>
                ) : (
                  "Check Schema"
                )}
              </button>

              <button
                onClick={handleRefreshSchemaCache}
                disabled={loading}
                className="flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Refreshing Cache...
                  </>
                ) : (
                  "Refresh Schema Cache"
                )}
              </button>
            </div>
          </div>

          {result && (
            <div className="mt-6 p-4 bg-gray-50 rounded-md">
              <h2 className="text-lg font-semibold text-gray-800 mb-2">Schema Check Results:</h2>

              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-gray-700">Column exists in information schema:</h3>
                  <div className={`mt-1 p-2 rounded ${result.columnExistsInSchema ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {result.columnExistsInSchema ? 'Yes' : 'No'}
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-gray-700">Column works in query:</h3>
                  <div className={`mt-1 p-2 rounded ${result.columnWorksInQuery ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {result.columnWorksInQuery ? 'Yes' : 'No'}
                    {result.queryError && <div className="mt-1 text-sm">{result.queryError}</div>}
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-gray-700">Direct query from client:</h3>
                  <div className={`mt-1 p-2 rounded ${result.directQuery?.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {result.directQuery?.success ? 'Success' : 'Failed'}
                    {result.directQuery?.error && <div className="mt-1 text-sm">{result.directQuery.error}</div>}
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-gray-700">All columns in discussion_posts table:</h3>
                  <div className="mt-1 p-2 rounded bg-gray-100 overflow-x-auto">
                    <pre className="text-xs">
                      {JSON.stringify(result.allColumns, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-6 p-4 bg-red-50 text-red-700 rounded-md">
              <p className="font-semibold">Error:</p>
              <p>{error}</p>
            </div>
          )}

          <div className="mt-6 flex justify-between">
            <Link
              href="/admin/fix-forum"
              className="text-indigo-600 hover:text-indigo-800 font-medium"
            >
              Go to Fix Forum Page
            </Link>
            <Link
              href="/admin/forum-moderation"
              className="text-indigo-600 hover:text-indigo-800 font-medium"
            >
              Go to Forum Moderation
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
