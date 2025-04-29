"use client";
import React, { useState, useEffect } from "react";
import { useUser } from "@/utils/useUser";
import { supabase } from "@/utils/supabaseClient";
import Link from "next/link";

export default function SimpleCreateTablePage() {
  const { data: user, loading: userLoading } = useUser();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [tableStatus, setTableStatus] = useState('checking');

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
      
      if (profile?.role === "admin") {
        checkTableExists();
      }
    } catch (err) {
      console.error("Error checking admin status:", err);
      setError("Failed to verify admin status");
    }
  };
  
  const checkTableExists = async () => {
    try {
      // Try to select from the table to see if it exists
      const { data, error } = await supabase
        .from('counseling_sessions')
        .select('id')
        .limit(1);
        
      if (error && error.code === 'PGRST116') {
        // No rows found, but table exists
        setTableStatus('exists_empty');
      } else if (error && error.code.includes('42P01')) {
        // Table doesn't exist
        setTableStatus('not_exists');
      } else if (error) {
        // Some other error
        throw error;
      } else {
        // Table exists and has data
        setTableStatus('exists_with_data');
      }
    } catch (err) {
      console.error("Error checking if table exists:", err);
      setTableStatus('error');
      setError("Failed to check if table exists: " + err.message);
    }
  };

  const createCounselingSessionsTable = async () => {
    try {
      setLoading(true);
      setMessage(null);
      setError(null);

      // Create the table using SQL
      const { error: createError } = await supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS public.counseling_sessions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            counselor_id TEXT,
            patient_id TEXT,
            scheduled_for TIMESTAMP WITH TIME ZONE,
            status TEXT DEFAULT 'scheduled',
            notes TEXT,
            video_enabled BOOLEAN DEFAULT false,
            video_room_id TEXT,
            video_join_url TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `
      });
      
      if (createError) {
        throw createError;
      }
      
      // Try to insert a test record to verify the table was created
      const { error: insertError } = await supabase
        .from('counseling_sessions')
        .insert({
          counselor_id: user.id,
          patient_id: user.id,
          scheduled_for: new Date().toISOString(),
          status: 'test',
          notes: 'This is a test record to verify the table structure',
          video_enabled: false
        });
        
      if (insertError) {
        throw insertError;
      }
      
      setMessage("Counseling sessions table created successfully");
      setTableStatus('exists_with_data');
    } catch (err) {
      console.error("Error creating table:", err);
      setError("Failed to create table: " + err.message);
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
            href="/account/signin?redirect=/admin/simple-create-table"
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
      <div className="mx-auto max-w-3xl">
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
            Create Counseling Sessions Table
          </h1>

          <div className="mb-8 rounded-lg border border-gray-200 bg-gray-50 p-4">
            <h2 className="mb-4 text-xl font-semibold text-gray-700">
              Counseling Sessions Table Status
            </h2>
            
            {tableStatus === 'checking' && (
              <p className="text-gray-600">Checking table status...</p>
            )}
            
            {tableStatus === 'exists_with_data' && (
              <div className="rounded-lg bg-green-50 p-4 text-green-700">
                The counseling_sessions table exists and contains data.
              </div>
            )}
            
            {tableStatus === 'exists_empty' && (
              <div className="rounded-lg bg-green-50 p-4 text-green-700">
                The counseling_sessions table exists but is empty.
              </div>
            )}
            
            {tableStatus === 'not_exists' && (
              <>
                <p className="mb-4 text-gray-600">
                  The counseling_sessions table does not exist in the database. Click the button below to create it.
                </p>
                <button
                  onClick={createCounselingSessionsTable}
                  disabled={loading}
                  className="rounded-lg bg-[#357AFF] px-6 py-3 text-white hover:bg-[#2E69DE] disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {loading ? "Creating Table..." : "Create Counseling Sessions Table"}
                </button>
              </>
            )}
            
            {tableStatus === 'error' && (
              <div className="rounded-lg bg-yellow-50 p-4 text-yellow-700">
                Could not determine table status. You can try creating the table anyway.
                <button
                  onClick={createCounselingSessionsTable}
                  disabled={loading}
                  className="mt-4 rounded-lg bg-[#357AFF] px-6 py-3 text-white hover:bg-[#2E69DE] disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {loading ? "Creating Table..." : "Create Counseling Sessions Table"}
                </button>
              </div>
            )}

            {message && (
              <div className="mt-4 rounded-lg bg-green-50 p-4 text-green-700">
                {message}
              </div>
            )}

            {error && (
              <div className="mt-4 rounded-lg bg-red-50 p-4 text-red-700">
                {error}
              </div>
            )}
          </div>
          
          <div className="mt-8">
            <h2 className="mb-4 text-xl font-semibold text-gray-700">
              Next Steps
            </h2>
            <p className="mb-4 text-gray-600">
              After creating the table, you can:
            </p>
            <ul className="list-inside list-disc space-y-2 text-gray-600">
              <li>
                <Link href="/counselor/sessions-new" className="text-blue-600 hover:underline">
                  Go to the counselor sessions page
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
