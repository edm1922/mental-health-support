"use client";
import React, { useState } from 'react';
import { useUser } from '@/utils/useUser';
import Link from 'next/link';

export default function ExecuteSqlPage() {
  const { data: user, loading: userLoading } = useUser();
  const [sqlFile, setSqlFile] = useState('fix-session-messages-rls.sql');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const executeSql = async () => {
    try {
      setLoading(true);
      setError(null);
      setResult(null);

      const response = await fetch('/api/counselor/execute-sql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ sqlFile }),
        credentials: 'include'
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to execute SQL');
      }

      setResult(data);
    } catch (err) {
      console.error('Error executing SQL:', err);
      setError(err.message || 'Failed to execute SQL');
    } finally {
      setLoading(false);
    }
  };

  if (userLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-xl p-8 max-w-md w-full">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-6">Only administrators can access this page.</p>
          <Link href="/home" className="block w-full bg-indigo-600 text-white text-center py-2 px-4 rounded-lg hover:bg-indigo-700">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/admin"
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
            Back to Admin
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-xl p-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">Execute SQL File</h1>

          <div className="mb-6">
            <label htmlFor="sqlFile" className="block text-sm font-medium text-gray-700 mb-2">
              SQL File Path
            </label>
            <input
              type="text"
              id="sqlFile"
              value={sqlFile}
              onChange={(e) => setSqlFile(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Enter SQL file path"
            />
            <p className="mt-1 text-sm text-gray-500">
              Enter the path to the SQL file relative to the project root
            </p>
          </div>

          <button
            onClick={executeSql}
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 disabled:bg-indigo-300"
          >
            {loading ? 'Executing...' : 'Execute SQL'}
          </button>

          {error && (
            <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-md">
              <p className="font-medium">Error:</p>
              <p>{error}</p>
            </div>
          )}

          {result && (
            <div className="mt-4 p-4 bg-green-50 text-green-600 rounded-md">
              <p className="font-medium">Success:</p>
              <p>{result.message}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
