"use client";
import React, { useState } from "react";
import Link from "next/link";

export default function FixForumPage() {
  const [loading, setLoading] = useState(false);
  const [refreshLoading, setRefreshLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleFixForum = async () => {
    try {
      setLoading(true);
      setResult(null);
      setError(null);

      // Call the API to add the is_approved column
      const response = await fetch('/api/forum/add-approval-column', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fix forum schema');
      }

      setResult(data);
    } catch (err) {
      console.error('Error fixing forum schema:', err);
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshSchemaCache = async () => {
    try {
      setRefreshLoading(true);
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

      setResult({
        success: true,
        message: 'Schema cache refreshed successfully. The forum should now work properly.'
      });
    } catch (err) {
      console.error('Error refreshing schema cache:', err);
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setRefreshLoading(false);
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

          <div className="mb-8 space-y-6">
            <div className="border-b pb-6">
              <h2 className="text-xl font-semibold text-gray-700 mb-3">Option 1: Add Missing Column</h2>
              <p className="mb-4 text-gray-600">
                This option will add the <code className="bg-gray-100 px-1 py-0.5 rounded">is_approved</code> column
                to the discussion_posts table if it doesn't exist. This column is required for the forum moderation
                functionality to work properly.
              </p>

              <button
                onClick={handleFixForum}
                disabled={loading}
                className="w-full flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Adding Column...
                  </>
                ) : (
                  "Add Missing Column"
                )}
              </button>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-700 mb-3">Option 2: Refresh Schema Cache</h2>
              <p className="mb-4 text-gray-600">
                If the column already exists but you're still seeing errors, this option will refresh the Supabase schema cache.
                This is useful when the column exists in the database but the application can't see it.
              </p>

              <button
                onClick={handleRefreshSchemaCache}
                disabled={refreshLoading}
                className="w-full flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
              >
                {refreshLoading ? (
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
            <div className="mt-6 p-4 bg-green-50 text-green-700 rounded-md">
              <p className="font-semibold">Success:</p>
              <p>{result.message}</p>
              <div className="mt-4">
                <Link
                  href="/community"
                  className="text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  Go to Community Forum
                </Link>
                <span className="mx-2">|</span>
                <Link
                  href="/admin/forum-moderation"
                  className="text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  Go to Forum Moderation
                </Link>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-6 p-4 bg-red-50 text-red-700 rounded-md">
              <p className="font-semibold">Error:</p>
              <p>{error}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
