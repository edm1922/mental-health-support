"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";

export default function FixForumSchemaPage() {
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [testPostResult, setTestPostResult] = useState(null);

  useEffect(() => {
    checkColumn();
  }, []);

  const checkColumn = async () => {
    try {
      setLoading(true);
      setResult(null);
      setError(null);

      // Call the API to check the is_approved column
      const response = await fetch('/api/forum/check-is-approved-column', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to check column');
      }

      setResult(data);
    } catch (err) {
      console.error('Error checking column:', err);
      setError(err.message || 'An unexpected error occurred');
    } finally {
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

      // Check the column again after forcing refresh
      await checkColumn();
    } catch (err) {
      console.error('Error forcing schema refresh:', err);
      setError(err.message || 'An unexpected error occurred');
      setLoading(false);
    }
  };

  const handleTestPost = async () => {
    try {
      setLoading(true);
      setTestPostResult(null);
      setError(null);

      // Call the API to test creating a post
      const response = await fetch('/api/forum/create-post-bypass-cache', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: 'Test Post from Admin',
          content: 'This is a test post created by an admin to test the forum functionality.'
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create test post');
      }

      setTestPostResult(data);

      // Check the column again after creating a post
      await checkColumn();
    } catch (err) {
      console.error('Error creating test post:', err);
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
          <h1 className="text-2xl font-bold text-gray-800 mb-6">Fix Forum Schema</h1>

          <div className="mb-6 space-y-4">
            <p className="text-gray-600">
              This page helps diagnose and fix issues with the forum schema, particularly the <code className="bg-gray-100 px-1 py-0.5 rounded">is_approved</code> column
              in the discussion_posts table.
            </p>

            <div className="flex space-x-4">
              <button
                onClick={checkColumn}
                disabled={loading}
                className="flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Checking...
                  </>
                ) : (
                  "Check Column"
                )}
              </button>

              <button
                onClick={handleForceSchemaRefresh}
                disabled={loading}
                className="flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Refreshing...
                  </>
                ) : (
                  "Force Schema Refresh"
                )}
              </button>

              <button
                onClick={handleTestPost}
                disabled={loading}
                className="flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating Test Post...
                  </>
                ) : (
                  "Create Test Post"
                )}
              </button>
            </div>
          </div>

          {result && (
            <div className="mt-6 p-4 bg-gray-50 rounded-md">
              <h2 className="text-lg font-semibold text-gray-800 mb-2">Column Check Results:</h2>

              <div className="space-y-4">
                {result.status && (
                  <div>
                    <h3 className="font-medium text-gray-700">Overall Status:</h3>
                    <div className={`mt-1 p-2 rounded ${result.status.overallStatus === 'healthy' ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}`}>
                      {result.status.overallStatus === 'healthy' ? 'Healthy' : 'Issue Detected'}
                    </div>
                  </div>
                )}

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

                {result.directQueryWorks !== undefined && (
                  <div>
                    <h3 className="font-medium text-gray-700">Direct SQL query works:</h3>
                    <div className={`mt-1 p-2 rounded ${result.directQueryWorks ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                      {result.directQueryWorks ? 'Yes' : 'No'}
                      {result.directQueryError && <div className="mt-1 text-sm">{result.directQueryError}</div>}
                    </div>
                  </div>
                )}

                {result.rlsEnabled !== undefined && (
                  <div>
                    <h3 className="font-medium text-gray-700">Row Level Security (RLS):</h3>
                    <div className={`mt-1 p-2 rounded bg-blue-50 text-blue-700`}>
                      {result.rlsEnabled ? 'Enabled' : 'Disabled'}
                    </div>
                  </div>
                )}

                {result.policies && (
                  <div>
                    <h3 className="font-medium text-gray-700">Table Policies:</h3>
                    <div className="mt-1 p-2 rounded bg-gray-100 overflow-x-auto">
                      {result.policies.length > 0 ? (
                        <pre className="text-xs">
                          {JSON.stringify(result.policies, null, 2)}
                        </pre>
                      ) : (
                        <p className="text-gray-500">No policies found</p>
                      )}
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="font-medium text-gray-700">Column Information:</h3>
                  <div className="mt-1 p-2 rounded bg-gray-100 overflow-x-auto">
                    {result.columnInfo && result.columnInfo.length > 0 ? (
                      <pre className="text-xs">
                        {JSON.stringify(result.columnInfo, null, 2)}
                      </pre>
                    ) : (
                      <p className="text-gray-500">No column information available</p>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-gray-700">All columns in discussion_posts table:</h3>
                  <div className="mt-1 p-2 rounded bg-gray-100 overflow-x-auto">
                    {result.allColumns && result.allColumns.length > 0 ? (
                      <pre className="text-xs">
                        {JSON.stringify(result.allColumns, null, 2)}
                      </pre>
                    ) : (
                      <p className="text-gray-500">No columns found</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {testPostResult && (
            <div className="mt-6 p-4 bg-blue-50 rounded-md">
              <h2 className="text-lg font-semibold text-blue-800 mb-2">Test Post Result:</h2>
              <div className="mt-1 p-2 rounded bg-white overflow-x-auto">
                <pre className="text-xs">
                  {JSON.stringify(testPostResult, null, 2)}
                </pre>
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
              href="/admin/test-schema"
              className="text-indigo-600 hover:text-indigo-800 font-medium"
            >
              Go to Test Schema Page
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
