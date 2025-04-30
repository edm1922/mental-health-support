"use client";
import React, { useState } from "react";
import { useUser } from "@/utils/useUser";
import { supabase } from "@/utils/supabaseClient";
import Link from "next/link";

export default function UpdateDatabasePage() {
  const { data: user, loading: userLoading } = useUser();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  React.useEffect(() => {
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

  const updateCounselingSessionsTable = async () => {
    try {
      setLoading(true);
      setMessage(null);
      setError(null);

      const response = await fetch("/api/database/update-counseling-sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update database");
      }

      setMessage(data.message || "Database updated successfully");
    } catch (err) {
      console.error("Error updating database:", err);
      setError(err.message || "Failed to update database");
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
            href="/account/signin?redirect=/admin/update-database"
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
            Database Management
          </h1>

          <div className="mb-8 rounded-lg border border-gray-200 bg-gray-50 p-4">
            <h2 className="mb-4 text-xl font-semibold text-gray-700">
              Update Counseling Sessions Table
            </h2>
            <p className="mb-4 text-gray-600">
              This will update the counseling_sessions table to ensure it has all the required columns for video calls.
            </p>
            <button
              onClick={updateCounselingSessionsTable}
              disabled={loading}
              className="rounded-lg bg-[#357AFF] px-6 py-3 text-white hover:bg-[#2E69DE] disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {loading ? "Updating..." : "Update Table"}
            </button>

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
        </div>
      </div>
    </div>
  );
}
