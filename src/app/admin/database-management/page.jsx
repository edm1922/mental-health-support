"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useUser } from "@/utils/useUser";
import { supabase } from "@/utils/supabaseClient";
import { fixDatabaseSchema, refreshSchemaCache, autoFixDatabaseSchema } from '@/utils/databaseMigrations';
import { useSearchParams } from 'next/navigation';

export default function DatabaseManagementPage() {
  const { data: user, loading: userLoading } = useUser();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [checkResult, setCheckResult] = useState(null);
  const [migrationResult, setMigrationResult] = useState(null);
  const [error, setError] = useState(null);
  const [migrationLoading, setMigrationLoading] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    if (user) {
      checkAdminStatus();
    }
  }, [user]);

  // Automatically run the database check when the page loads
  useEffect(() => {
    if (isAdmin && !loading && !checkResult) {
      checkDatabaseSchema();
    }
  }, [isAdmin, loading]);

  // Automatically run the fix when critical issues are detected
  useEffect(() => {
    if (checkResult?.schemaStatus?.criticalIssuesFound && !migrationResult && !loading && !migrationLoading) {
      console.log('Critical issues detected, running automatic fix...');
      handleAutoFix();
    }
  }, [checkResult]);

  // Check for auto_fix query parameter and run the fix automatically
  useEffect(() => {
    const autoFix = searchParams.get('auto_fix');
    if (autoFix === 'true' && isAdmin && !loading && !migrationLoading && !migrationResult) {
      console.log('Auto fix parameter detected, running automatic fix...');
      handleAutoFix();
    }
  }, [searchParams, isAdmin, loading, migrationLoading, migrationResult]);

  const checkAdminStatus = async () => {
    try {
      // Check if the user is an admin
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profileError) {
        throw new Error('Failed to fetch user profile');
      }

      if (profile.role !== 'admin') {
        setIsAdmin(false);
        setError('Only administrators can access this page');
      } else {
        setIsAdmin(true);
        // Automatically check database schema on page load
        checkDatabaseSchema();
      }
    } catch (err) {
      console.error("Error checking admin status:", err);
      setError(err.message || "Failed to verify admin status");
    } finally {
      setLoading(false);
    }
  };

  const checkDatabaseSchema = async () => {
    try {
      setLoading(true);
      setError(null);
      setCheckResult(null);

      const response = await fetch('/api/system/check-database', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ runMigration: false })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to check database schema');
      }

      setCheckResult(data);
    } catch (err) {
      console.error("Error checking database schema:", err);
      setError(err.message || "Failed to check database schema");
    } finally {
      setLoading(false);
    }
  };

  const runDatabaseMigration = async () => {
    try {
      setMigrationLoading(true);
      setError(null);
      setMigrationResult(null);

      const response = await fetch('/api/system/check-database', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ runMigration: true })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to run database migration');
      }

      setMigrationResult(data);

      // Refresh schema check after migration
      await checkDatabaseSchema();
    } catch (err) {
      console.error("Error running database migration:", err);
      setError(err.message || "Failed to run database migration");
    } finally {
      setMigrationLoading(false);
    }
  };

  const handleAutoFix = async () => {
    try {
      setLoading(true);
      setError(null);
      setMigrationResult(null);

      // Run the automatic fix that handles all steps
      const result = await autoFixDatabaseSchema();

      if (result.success) {
        setMigrationResult({
          success: true,
          message: result.message,
          operations: result.operations
        });

        // Refresh schema check after successful fix
        await checkDatabaseSchema();
      } else {
        throw new Error(result.message);
      }
    } catch (err) {
      console.error("Error fixing database schema:", err);
      setError(err.message || "Failed to fix database schema");
      setMigrationResult({
        success: false,
        message: err.message,
        errors: [{ operation: 'auto_fix', error: err.message }]
      });
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

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-xl p-8 max-w-md w-full">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Authentication Required</h1>
          <p className="text-gray-600 mb-6">Please sign in to access this page.</p>
          <Link href="/account/signin" className="block w-full bg-indigo-600 text-white text-center py-2 px-4 rounded-lg hover:bg-indigo-700">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  if (!isAdmin && !loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-xl p-8 max-w-md w-full">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-6">Only administrators can access this page.</p>
          <Link href="/" className="block w-full bg-indigo-600 text-white text-center py-2 px-4 rounded-lg hover:bg-indigo-700">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto">
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

        <h1 className="text-3xl font-bold text-gray-800 mb-6">Database Management</h1>

        {error && (
          <div className="mb-6 bg-red-50 p-4 rounded-lg text-red-600">
            <p className="font-semibold">Error:</p>
            <p>{error}</p>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-xl p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Fix Forum Schema Issues</h2>
          <p className="text-gray-600 mb-4">
            If you're experiencing issues with the forum moderation page, such as missing removal columns in the discussion_posts table, you can fix it here.
          </p>
          <div className="flex justify-center mb-6">
            <button
              onClick={handleAutoFix}
              disabled={loading}
              className="w-full md:w-auto px-6 py-3 text-base font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors duration-200"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Automatically Fixing Database Schema...
                </div>
              ) : (
                "Fix Database Schema Automatically"
              )}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-xl p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Database Schema Check</h2>
            <p className="text-gray-600 mb-4">
              Check if the database schema is properly configured. This will verify that all required tables and columns exist.
            </p>
            <button
              onClick={checkDatabaseSchema}
              disabled={loading}
              className="w-full flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
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
                "Check Database Schema"
              )}
            </button>

            {checkResult && (
              <div className="mt-6">
                <h3 className="font-medium text-gray-700 mb-2">Schema Check Results:</h3>

                <div className="space-y-4">
                  {checkResult.schemaStatus.criticalIssuesFound ? (
                    <div className="p-3 bg-red-50 text-red-700 rounded-md">
                      <p className="font-semibold">Critical issues found!</p>
                      <p className="text-sm">The database schema is missing required tables or columns.</p>
                    </div>
                  ) : (
                    <div className="p-3 bg-green-50 text-green-700 rounded-md">
                      <p className="font-semibold">Schema check passed!</p>
                      <p className="text-sm">All critical tables and columns are present.</p>
                    </div>
                  )}

                  <div>
                    <h4 className="font-medium text-gray-700 mb-1">Tables:</h4>
                    <div className="space-y-2">
                      {Object.entries(checkResult.schemaStatus.tables).map(([tableName, tableStatus]) => (
                        <div key={tableName} className="p-2 bg-gray-50 rounded-md">
                          <div className="flex items-center">
                            <div className={`w-3 h-3 rounded-full mr-2 ${tableStatus.exists ? 'bg-green-500' : 'bg-red-500'}`}></div>
                            <p className="font-medium">{tableName}</p>
                          </div>

                          {tableStatus.exists && tableStatus.columns && (
                            <div className="mt-2 pl-5">
                              <p className="text-sm text-gray-500 mb-1">Columns:</p>
                              <div className="grid grid-cols-2 gap-1">
                                {Object.entries(tableStatus.columns).map(([columnName, exists]) => (
                                  <div key={columnName} className="flex items-center">
                                    <div className={`w-2 h-2 rounded-full mr-1 ${exists ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                    <p className="text-sm">{columnName}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-xl p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Database Migration</h2>
            <p className="text-gray-600 mb-4">
              Run a database migration to fix schema issues. This will create missing tables and columns.
            </p>
            <div className="bg-yellow-50 p-3 rounded-md text-yellow-700 mb-4">
              <p className="font-semibold">Warning:</p>
              <p className="text-sm">This operation will modify the database schema. Make sure you have a backup before proceeding.</p>
            </div>
            <button
              onClick={runDatabaseMigration}
              disabled={migrationLoading}
              className="w-full flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50"
            >
              {migrationLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Running Migration...
                </>
              ) : (
                "Run Database Migration"
              )}
            </button>

            {migrationResult && (
              <div className="mt-6">
                <h3 className="font-medium text-gray-700 mb-2">Migration Results:</h3>

                <div className={`p-3 ${migrationResult.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'} rounded-md mb-4`}>
                  <p className="font-semibold">{migrationResult.success ? 'Migration successful!' : 'Migration failed!'}</p>
                  <p className="text-sm">{migrationResult.message}</p>
                </div>

                {migrationResult.operations && migrationResult.operations.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-700 mb-1">Operations Performed:</h4>
                    <div className="max-h-40 overflow-y-auto bg-gray-50 p-2 rounded-md">
                      <ul className="text-sm space-y-1">
                        {migrationResult.operations.map((op, index) => (
                          <li key={index} className="flex items-center">
                            <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                            {op.table} - {op.operation} {op.column ? `(${op.column})` : ''}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {migrationResult.errors && migrationResult.errors.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-medium text-gray-700 mb-1">Errors:</h4>
                    <div className="max-h-40 overflow-y-auto bg-red-50 p-2 rounded-md">
                      <ul className="text-sm space-y-1">
                        {migrationResult.errors.map((err, index) => (
                          <li key={index} className="text-red-700">
                            {err.table} {err.column ? `(${err.column})` : ''} - {err.error}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-xl p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Database Documentation</h2>
          <p className="text-gray-600 mb-4">
            View the database schema documentation to understand the structure of the database.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-medium text-gray-800 mb-2">Schema Documentation</h3>
              <p className="text-gray-600 text-sm mb-3">
                Detailed documentation of the database schema, including tables, columns, and relationships.
              </p>
              <Link
                href="/docs/database-schema.md"
                target="_blank"
                className="inline-flex items-center text-indigo-600 hover:text-indigo-800"
              >
                <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                View Documentation
              </Link>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-medium text-gray-800 mb-2">Migration Script</h3>
              <p className="text-gray-600 text-sm mb-3">
                View the database migration script that ensures all required tables and columns exist.
              </p>
              <Link
                href="/scripts/migrate-database.js"
                target="_blank"
                className="inline-flex items-center text-indigo-600 hover:text-indigo-800"
              >
                <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
                View Script
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
