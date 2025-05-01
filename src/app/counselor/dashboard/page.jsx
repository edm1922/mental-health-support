"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/utils/supabaseClient";
import CounselorNavbar from "@/components/ui/CounselorNavbar";

export default function CounselorDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        console.log("Loading counselor dashboard...");

        // Get the current session
        const { data: { session } } = await supabase.auth.getSession();

        if (session) {
          console.log("Session found for user:", session.user.id);

          // Set basic user data
          setUser({
            id: session.user.id,
            email: session.user.email,
            displayName: session.user.email.split("@")[0],
            role: 'counselor'
          });

          // Fetch sessions
          const { data: sessionsData } = await supabase
            .from("sessions")
            .select(`
              id,
              status,
              session_date,
              session_type,
              notes,
              client_id,
              counselor_id
            `)
            .eq("counselor_id", session.user.id);

          setSessions(sessionsData || []);
        }

        setLoading(false);
      } catch (err) {
        console.error("Dashboard loading error:", err);
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#357AFF] border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Simplified error handling - no access denied screen

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <CounselorNavbar />
      <div className="p-8 mx-auto max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Counselor Dashboard</h1>
          {user && (
            <p className="mt-2 text-gray-600">Welcome, {user.displayName}!</p>
          )}
        </div>

        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-xl bg-white p-6 shadow-lg">
            <h2 className="mb-4 text-xl font-semibold text-gray-800">Your Sessions</h2>
            <p className="text-3xl font-bold text-blue-600">{sessions.length}</p>
            <p className="mt-2 text-gray-600">Total sessions</p>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-lg">
            <h2 className="mb-4 text-xl font-semibold text-gray-800">Upcoming</h2>
            <p className="text-3xl font-bold text-green-600">
              {sessions.filter(s => new Date(s.session_date) > new Date()).length}
            </p>
            <p className="mt-2 text-gray-600">Upcoming sessions</p>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-lg">
            <h2 className="mb-4 text-xl font-semibold text-gray-800">Completed</h2>
            <p className="text-3xl font-bold text-purple-600">
              {sessions.filter(s => s.status === "completed").length}
            </p>
            <p className="mt-2 text-gray-600">Completed sessions</p>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="mb-4 text-xl font-semibold text-gray-800">Recent Sessions</h2>

          {sessions.length === 0 ? (
            <div className="rounded-xl bg-white p-6 shadow-lg text-center">
              <p className="text-gray-600">No sessions found.</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {sessions.slice(0, 3).map((session) => (
                <div key={session.id} className="rounded-xl bg-white p-6 shadow-lg">
                  <div className="mb-4 flex items-center justify-between">
                    <span className="text-lg font-semibold">
                      {new Date(session.session_date).toLocaleDateString()}
                    </span>
                    <span
                      className={`rounded-full px-3 py-1 text-sm ${
                        session.status === "completed"
                          ? "bg-green-100 text-green-700"
                          : session.status === "cancelled"
                          ? "bg-red-100 text-red-700"
                          : session.status === "ongoing"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {session.status}
                    </span>
                  </div>
                  <div className="mb-4 space-y-2">
                    <p className="text-gray-600">
                      <span className="font-semibold">Patient:</span>{" "}
                      {session.client?.display_name || "Unknown Patient"}
                    </p>
                    <p className="text-gray-600">
                      <span className="font-semibold">Time:</span>{" "}
                      {new Date(session.session_date).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-4">
          <Link
            href="/counselor/sessions"
            className="rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
          >
            View All Sessions
          </Link>

          <Link
            href="/home"
            className="rounded-lg bg-gray-500 px-4 py-2 text-white hover:bg-gray-600"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
