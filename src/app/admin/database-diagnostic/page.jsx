"use client";
import React, { useState, useEffect } from "react";
import { useUser } from "@/utils/useUser";
import { supabase } from "@/utils/supabaseClient";
import Link from "next/link";

export default function DatabaseDiagnosticPage() {
  const { data: user, loading: userLoading } = useUser();
  const [isAdmin, setIsAdmin] = useState(false);
  const [tableInfo, setTableInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user) {
      checkAdminStatus();
    }
  }, [user]);

  const checkAdminStatus = async () => {
    try {
      const { data: profile, error } = await supabase
        .from("user_profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      setIsAdmin(profile?.role === "admin");
    } catch (err) {
      console.error("Error checking admin status:", err);
      setError("Failed to verify admin status");
    }
  };

  const checkTableStructure = async () => {
    try {
      setLoading(true);
      setError(null);

      // First check if the table exists
      const { data: tableExists, error: tableCheckError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .eq('table_name', 'counseling_sessions')
        .single();

      if (tableCheckError && tableCheckError.code !== 'PGRST116') {
        throw new Error('Error checking if table exists: ' + tableCheckError.message);
      }

      if (!tableExists) {
        return setTableInfo({
          exists: false,
          columns: [],
          sampleRow: null
        });
      }

      // Get the column information for the counseling_sessions table
      const { data, error } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable, column_default')
        .eq('table_schema', 'public')
        .eq('table_name', 'counseling_sessions')
        .order('ordinal_position');

      if (error) {
        throw error;
      }

      // Get a sample row from the table
      const { data: sampleData, error: sampleError } = await supabase
        .from('counseling_sessions')
        .select('*')
        .limit(1);

      if (sampleError && sampleError.code !== 'PGRST116') {
        console.error('Error fetching sample data:', sampleError);
      }

      setTableInfo({
        columns: data,
        sampleRow: sampleData && sampleData.length > 0 ? sampleData[0] : null
      });
    } catch (err) {
      console.error("Error checking table structure:", err);
      setError(err.message || "Failed to check table structure");
    } finally {
      setLoading(false);
    }
  };

  if (userLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#357AFF] border-t-transparent"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-xl">
          <h1 className="mb-4 text-2xl font-bold text-gray-800">Access Denied</h1>
          <p className="mb-6 text-gray-600">
            Please sign in to access this page.
          </p>
          <Link
            href="/account/signin?redirect=/admin/database-diagnostic"
            className="inline-block rounded-lg bg-[#357AFF] px-6 py-3 text-white hover:bg-[#2E69DE]"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-xl">
          <h1 className="mb-4 text-2xl font-bold text-gray-800">Admin Access Only</h1>
          <p className="mb-6 text-gray-600">
            This page is restricted to administrators.
          </p>
          <Link
            href="/"
            className="inline-block rounded-lg bg-[#357AFF] px-6 py-3 text-white hover:bg-[#2E69DE]"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
      <div className="mx-auto max-w-4xl">
        <Link
          href="/admin"
          className="mb-4 inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-gray-600 shadow-md hover:bg-gray-50"
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

        <div className="mb-8 rounded-2xl bg-white p-6 shadow-xl md:p-8">
          <h1 className="mb-6 text-2xl font-bold text-gray-800">
            Database Diagnostic
          </h1>

          <div className="mb-8">
            <button
              onClick={checkTableStructure}
              disabled={loading}
              className="rounded-lg bg-[#357AFF] px-6 py-3 text-white hover:bg-[#2E69DE] disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {loading ? "Checking..." : "Check counseling_sessions Table Structure"}
            </button>

            {error && (
              <div className="mt-4 rounded-lg bg-red-50 p-4 text-red-700">
                {error}
              </div>
            )}
          </div>

          {tableInfo && (
            <div className="mt-8">
              <h2 className="mb-4 text-xl font-semibold text-gray-700">
                Table Structure
              </h2>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Column Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Data Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nullable
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Default
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {tableInfo.columns.map((column, index) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {column.column_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {column.data_type}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {column.is_nullable}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {column.column_default || 'NULL'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {tableInfo.sampleRow && (
                <>
                  <h2 className="mt-8 mb-4 text-xl font-semibold text-gray-700">
                    Sample Row
                  </h2>
                  <div className="bg-gray-50 p-4 rounded-lg overflow-x-auto">
                    <pre className="text-sm text-gray-800">
                      {JSON.stringify(tableInfo.sampleRow, null, 2)}
                    </pre>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
