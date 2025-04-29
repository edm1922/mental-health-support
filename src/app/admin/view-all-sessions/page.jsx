"use client";
import React, { useState, useEffect } from "react";
import { useUser } from "@/utils/useUser";
import { supabase } from "@/utils/supabaseClient";
import Link from "next/link";

export default function ViewAllSessionsPage() {
  const { data: user, loading: userLoading } = useUser();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userProfiles, setUserProfiles] = useState({});

  useEffect(() => {
    if (user) {
      loadSessions();
    }
  }, [user]);

  const loadSessions = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get all sessions
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('counseling_sessions')
        .select('*')
        .order('created_at', { ascending: false });

      if (sessionsError) throw sessionsError;
      
      setSessions(sessionsData || []);

      // Get all user profiles for reference
      if (sessionsData && sessionsData.length > 0) {
        // Extract all user IDs (both counselors and patients)
        const userIds = new Set();
        sessionsData.forEach(session => {
          if (session.counselor_id) userIds.add(session.counselor_id);
          if (session.patient_id) userIds.add(session.patient_id);
        });

        // Fetch user profiles
        const { data: profiles, error: profilesError } = await supabase
          .from('user_profiles')
          .select('id, display_name')
          .in('id', Array.from(userIds));

        if (profilesError) throw profilesError;

        // Create a map of user IDs to display names
        const profileMap = {};
        if (profiles) {
          profiles.forEach(profile => {
            profileMap[profile.id] = profile.display_name || 'Unknown User';
          });
        }

        setUserProfiles(profileMap);
      }
    } catch (err) {
      console.error("Error loading sessions:", err);
      setError("Failed to load sessions: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  if (userLoading || loading) {
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
      <div className="max-w-7xl mx-auto">
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
          
          <div className="flex space-x-2">
            <Link
              href="/admin/create-test-session"
              className="rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700"
            >
              Create Test Session
            </Link>
            <button
              onClick={loadSessions}
              className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              Refresh
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-xl p-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">All Counseling Sessions</h1>
          
          {error && (
            <div className="mb-6 bg-red-50 p-4 rounded-lg text-red-600">
              {error}
            </div>
          )}

          {sessions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No counseling sessions found</p>
              <Link
                href="/admin/create-test-session"
                className="mt-4 inline-block rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
              >
                Create Test Session
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead>
                  <tr className="bg-gray-100 text-gray-700 text-left">
                    <th className="py-3 px-4 font-semibold">ID</th>
                    <th className="py-3 px-4 font-semibold">Counselor</th>
                    <th className="py-3 px-4 font-semibold">Patient</th>
                    <th className="py-3 px-4 font-semibold">Session Date</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                    <th className="py-3 px-4 font-semibold">Created At</th>
                    <th className="py-3 px-4 font-semibold">Video</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {sessions.map((session) => (
                    <tr key={session.id} className="hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm">
                        <span className="font-mono text-xs">{session.id}</span>
                      </td>
                      <td className="py-3 px-4">
                        {userProfiles[session.counselor_id] || 'Unknown Counselor'}
                      </td>
                      <td className="py-3 px-4">
                        {userProfiles[session.patient_id] || 'Unknown Patient'}
                      </td>
                      <td className="py-3 px-4">
                        {formatDate(session.session_date)}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          session.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                          session.status === 'ongoing' ? 'bg-green-100 text-green-800' :
                          session.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                          session.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {session.status || 'Unknown'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {formatDate(session.created_at)}
                      </td>
                      <td className="py-3 px-4">
                        {session.video_enabled ? (
                          <span className="text-green-600">Enabled</span>
                        ) : (
                          <span className="text-gray-400">Disabled</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
