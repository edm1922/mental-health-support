"use client";
import React, { useState } from "react";

export default function ForumAdminPage() {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleDropTables = async () => {
    if (!confirm("Are you sure you want to drop all forum tables? This action cannot be undone.")) {
      return;
    }

    setLoading(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/forum/drop-tables", {
        method: "POST",
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to drop tables");
      }

      setMessage("Forum tables dropped successfully. You can now recreate them by visiting the community page.");
    } catch (err) {
      setError(`Error: ${err.message}`);
      console.error("Error dropping tables:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleInitTables = async () => {
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/forum/init-tables", {
        method: "GET",
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to initialize tables");
      }

      setMessage("Forum tables initialized successfully.");
    } catch (err) {
      setError(`Error: ${err.message}`);
      console.error("Error initializing tables:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
      <div className="mx-auto max-w-4xl">
        <button
          onClick={() => window.history.back()}
          className="mb-4 flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-gray-600 shadow-md hover:bg-gray-50"
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
          Go Back
        </button>

        <div className="mb-6 rounded-2xl bg-white p-6 shadow-xl">
          <h1 className="mb-6 text-3xl font-bold text-gray-800">Forum Admin</h1>

          {message && (
            <div className="mb-4 rounded-lg bg-green-50 p-4 text-green-600">
              {message}
            </div>
          )}

          {error && (
            <div className="mb-4 rounded-lg bg-red-50 p-4 text-red-500">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div className="rounded-lg bg-gray-50 p-4">
              <h2 className="mb-2 text-xl font-bold text-gray-800">Reset Forum Tables</h2>
              <p className="mb-4 text-gray-600">
                This will drop all forum tables and recreate them. All posts and comments will be lost.
              </p>
              <button
                onClick={handleDropTables}
                disabled={loading}
                className="rounded-lg bg-red-500 px-4 py-2 text-white hover:bg-red-600 disabled:opacity-50"
              >
                {loading ? "Processing..." : "Drop Tables"}
              </button>
            </div>

            <div className="rounded-lg bg-gray-50 p-4">
              <h2 className="mb-2 text-xl font-bold text-gray-800">Initialize Forum Tables</h2>
              <p className="mb-4 text-gray-600">
                This will create the forum tables if they don't exist.
              </p>
              <button
                onClick={handleInitTables}
                disabled={loading}
                className="rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 disabled:opacity-50"
              >
                {loading ? "Processing..." : "Initialize Tables"}
              </button>
            </div>

            <div className="rounded-lg bg-gray-50 p-4">
              <h2 className="mb-2 text-xl font-bold text-gray-800">Go to Community Forum</h2>
              <p className="mb-4 text-gray-600">
                Visit the community forum page.
              </p>
              <a
                href="/community"
                className="inline-block rounded-lg bg-[#357AFF] px-4 py-2 text-white hover:bg-[#2E69DE]"
              >
                Go to Community
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
