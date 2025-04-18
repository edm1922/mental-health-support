"use client";
import React, { useState } from "react";
import { useUser } from "@/utils/useUser";
import { supabase } from "@/utils/supabaseClient";
import Link from "next/link";
import { initForumTables } from "./init-forum-tables";

export default function FixDatabasePage() {
  const { data: user, loading: userLoading } = useUser();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [tableInfo, setTableInfo] = useState(null);

  const checkTableStructure = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      setTableInfo(null);

      // Check if the counseling_sessions table exists
      const { data: tableExists, error: tableExistsError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .eq('table_name', 'counseling_sessions')
        .single();

      if (tableExistsError && tableExistsError.code !== 'PGRST116') {
        throw new Error(`Error checking if table exists: ${tableExistsError.message}`);
      }

      if (!tableExists) {
        setTableInfo({ exists: false });
        setSuccess("Counseling sessions table does not exist. You can create it.");
        return;
      }

      // Check the table structure
      const { data: columns, error: columnsError } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable')
        .eq('table_schema', 'public')
        .eq('table_name', 'counseling_sessions')
        .order('ordinal_position');

      if (columnsError) {
        throw new Error(`Error checking table structure: ${columnsError.message}`);
      }

      setTableInfo({ exists: true, columns });
      setSuccess("Table structure checked successfully.");
    } catch (err) {
      console.error("Error checking table structure:", err);
      setError(err.message || "Failed to check table structure");
    } finally {
      setLoading(false);
    }
  };

  const fixTableStructure = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      // Drop the existing table
      const { error: dropError } = await supabase.rpc('exec_sql', {
        sql: `DROP TABLE IF EXISTS public.counseling_sessions;`
      });

      if (dropError) {
        throw new Error(`Error dropping table: ${dropError.message}`);
      }

      // Create a new table with the correct structure
      const { error: createError } = await supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE public.counseling_sessions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            counselor_id UUID NOT NULL,
            patient_id UUID NOT NULL,
            session_date TIMESTAMP WITH TIME ZONE NOT NULL,
            duration INTEGER DEFAULT 60,
            status TEXT DEFAULT 'scheduled',
            notes TEXT,
            video_enabled BOOLEAN DEFAULT false,
            video_room_id TEXT,
            video_join_url TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );

          -- Add indexes for better performance
          CREATE INDEX IF NOT EXISTS counseling_sessions_counselor_id_idx ON public.counseling_sessions(counselor_id);
          CREATE INDEX IF NOT EXISTS counseling_sessions_patient_id_idx ON public.counseling_sessions(patient_id);
        `
      });

      if (createError) {
        throw new Error(`Error creating table: ${createError.message}`);
      }

      // Check the new table structure
      await checkTableStructure();
      setSuccess("Table structure fixed successfully.");
    } catch (err) {
      console.error("Error fixing table structure:", err);
      setError(err.message || "Failed to fix table structure");
    } finally {
      setLoading(false);
    }
  };

  const createTestSession = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      // Get the current user's ID
      const userId = user.id;

      // Create a test session
      const { data: sessionData, error: sessionError } = await supabase
        .from('counseling_sessions')
        .insert({
          counselor_id: userId,
          patient_id: userId, // Using the same ID for testing
          session_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
          duration: 60,
          status: 'scheduled',
          notes: 'Test session',
          video_enabled: true,
          video_room_id: 'test-room',
          video_join_url: 'https://example.com/video/test-room'
        })
        .select();

      if (sessionError) {
        throw new Error(`Error creating test session: ${sessionError.message}`);
      }

      setSuccess(`Test session created successfully with ID: ${sessionData[0].id}`);
    } catch (err) {
      console.error("Error creating test session:", err);
      setError(err.message || "Failed to create test session");
    } finally {
      setLoading(false);
    }
  };

  const initializeForumTables = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      await initForumTables();

      setSuccess("Forum tables initialized successfully!");
    } catch (err) {
      console.error("Error initializing forum tables:", err);
      setError(err.message || "Failed to initialize forum tables");
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/"
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
            Back to Home
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-xl p-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">Fix Database Structure</h1>

          {error && (
            <div className="mb-6 bg-red-50 p-4 rounded-lg text-red-600">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 bg-green-50 p-4 rounded-lg text-green-600">
              {success}
            </div>
          )}

          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Counseling Sessions Table</h2>
              <p className="text-gray-600 mb-4">
                Check and fix the structure of the counseling_sessions table.
              </p>

              <div className="flex space-x-4 mb-4">
                <button
                  onClick={checkTableStructure}
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                  disabled={loading}
                >
                  {loading ? "Checking..." : "Check Structure"}
                </button>

                <button
                  onClick={fixTableStructure}
                  className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                  disabled={loading}
                >
                  {loading ? "Fixing..." : "Fix Structure"}
                </button>

                <button
                  onClick={createTestSession}
                  className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                  disabled={loading || !tableInfo?.exists}
                >
                  {loading ? "Creating..." : "Create Test Session"}
                </button>
              </div>

              {tableInfo && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-800 mb-2">Table Information</h3>

                  {!tableInfo.exists ? (
                    <p className="text-red-600">Table does not exist.</p>
                  ) : (
                    <div>
                      <p className="text-green-600 mb-2">Table exists with {tableInfo.columns.length} columns:</p>
                      <div className="overflow-x-auto">
                        <table className="min-w-full bg-white">
                          <thead>
                            <tr>
                              <th className="py-2 px-4 border-b border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Column Name
                              </th>
                              <th className="py-2 px-4 border-b border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Data Type
                              </th>
                              <th className="py-2 px-4 border-b border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Nullable
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {tableInfo.columns.map((column, index) => (
                              <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                                <td className="py-2 px-4 border-b border-gray-200 text-sm">
                                  {column.column_name}
                                </td>
                                <td className="py-2 px-4 border-b border-gray-200 text-sm">
                                  {column.data_type}
                                </td>
                                <td className="py-2 px-4 border-b border-gray-200 text-sm">
                                  {column.is_nullable === "YES" ? "Yes" : "No"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
