"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/utils/supabaseClient";
import Navbar from "@/components/ui/Navbar";

export default function CounselorDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    // Redirect to the new counselor dashboard path
    router.push('/counselor/dashboard');
    return;

    const checkAuth = async () => {
      try {
        console.log("Checking authentication on counselor dashboard...");
        // Get the current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        console.log("Session check result:", session ? `Session found for user ${session.user.id}` : "No session",
                    sessionError ? `Error: ${sessionError.message}` : "No error");

        if (sessionError) {
          console.error("Session error:", sessionError);
          throw new Error(sessionError.message);
        }

        if (!session) {
          console.log("No session found, redirecting to signin");
          // Use window.location for a hard redirect
          window.location.href = "/account/signin?redirect=/counselor/dashboard";
          return;
        }

        console.log("Session user ID:", session.user.id, "Email:", session.user.email);

        // Check if the user is a counselor
        console.log("Checking if user is a counselor...");
        const { data: profile, error: profileError } = await supabase
          .from("user_profiles")
          .select("role, display_name")
          .eq("id", session.user.id)
          .single();

        console.log("User profile check:", profile, profileError ? `Error: ${profileError.message}` : "No error");

        if (profileError) {
          console.error("Error fetching user profile:", profileError);
          throw new Error(profileError.message);
        }

        if (!profile) {
          console.log("No profile found for user");
          setError("Your user profile could not be found. Please contact support.");
          setLoading(false);
          return;
        }

        if (profile.role !== "counselor") {
          console.log("User is not a counselor, role:", profile.role);
          setError("You don't have counselor privileges. Your current role is: " + profile.role);
          setLoading(false);

          // Add a button to redirect to home after 3 seconds
          setTimeout(() => {
            window.location.href = "/home";
          }, 3000);

          return;
        }

        console.log("User confirmed as counselor with display name:", profile.display_name);

        // Set user data
        setUser({
          id: session.user.id,
          email: session.user.email,
          displayName: profile.display_name || session.user.email.split("@")[0],
          role: profile.role
        });

        // Fetch sessions
        const { data: sessionsData, error: sessionsError } = await supabase
          .from("sessions")
          .select(`
            id,
            status,
            session_date,
            session_type,
            notes,
            client:client_id (
              id,
              display_name
            )
          `)
          .eq("counselor_id", session.user.id);

        if (sessionsError) {
          throw new Error(sessionsError.message);
        }

        setSessions(sessionsData || []);
        setLoading(false);
      } catch (err) {
        console.error("Auth check error:", err);
        setError(err.message);
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

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

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-xl">
          <h1 className="mb-4 text-2xl font-bold text-gray-800">Access Denied</h1>
          <p className="mb-6 text-gray-600">{error}</p>
          <div className="space-y-3">
            <Link
              href="/home"
              className="inline-block rounded-lg bg-[#357AFF] px-6 py-3 text-white hover:bg-[#2E69DE]"
            >
              Return Home
            </Link>

            {process.env.NODE_ENV === 'development' && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-400 mb-2">Development Testing:</p>
                <div className="flex justify-center space-x-4">
                  <button
                    onClick={async () => {
                      try {
                        console.log("Testing user role...");
                        const { data: { session } } = await supabase.auth.getSession();
                        if (session) {
                          const { data, error } = await supabase
                            .from('user_profiles')
                            .select('*')
                            .eq('id', session.user.id)
                            .single();

                          console.log("User profile test:", data, error);
                          alert(JSON.stringify(data || {}, null, 2));
                        } else {
                          alert("No session found");
                        }
                      } catch (e) {
                        console.error("Test error:", e);
                        alert("Error: " + e.message);
                      }
                    }}
                    className="text-xs text-blue-400 hover:text-blue-600"
                  >
                    Test User Role
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <Navbar />
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
