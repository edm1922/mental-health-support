"use client";
import React, { useState, useEffect } from "react";
import { useUser } from "@/utils/useUser";
import { supabase } from "@/utils/supabaseClient";
import Link from "next/link";

export default function SessionManagementPage() {
  const { data: user, loading: userLoading } = useUser();
  const [sessions, setSessions] = useState([]);
  const [counselors, setCounselors] = useState([]);
  const [selectedCounselor, setSelectedCounselor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all"); // "all", "scheduled", "completed", "cancelled"

  useEffect(() => {
    if (user) {
      checkAdminStatus();
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadCounselors();
      loadSessions();
    }
  }, [user, selectedCounselor, statusFilter]);

  const checkAdminStatus = async () => {
    try {
      // Get the current auth token
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        throw new Error('Authentication required');
      }

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
        throw new Error('Only administrators can access this page');
      }
    } catch (err) {
      console.error("Error checking admin status:", err);
      setError(err.message || "Failed to verify admin status");
    }
  };

  const loadCounselors = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get the current auth token
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        throw new Error('Authentication required');
      }

      // Get all counselors
      const { data: counselorProfiles, error: counselorsError } = await supabase
        .from('user_profiles')
        .select('id, display_name, bio')
        .eq('role', 'counselor');

      if (counselorsError) {
        throw new Error('Failed to fetch counselors');
      }

      setCounselors(counselorProfiles || []);
    } catch (err) {
      console.error("Error loading counselors:", err);
      setError(err.message || "Failed to load counselors");
    } finally {
      setLoading(false);
    }
  };

  const loadSessions = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get the current auth token
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        throw new Error('Authentication required');
      }

      // Build the query
      let query = supabase
        .from('counseling_sessions')
        .select(`
          *,
          counselor:counselor_id(id, display_name),
          client:patient_id(id, display_name)
        `)
        .order('session_date', { ascending: false });

      // Add counselor filter if selected
      if (selectedCounselor) {
        query = query.eq('counselor_id', selectedCounselor.id);
      }

      // Add status filter if not "all"
      if (statusFilter !== "all") {
        query = query.eq('status', statusFilter);
      }

      // Execute the query
      const { data: sessionData, error: sessionsError } = await query;

      if (sessionsError) {
        throw new Error('Failed to fetch sessions');
      }

      setSessions(sessionData || []);
    } catch (err) {
      console.error("Error loading sessions:", err);
      setError(err.message || "Failed to load sessions");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'scheduled':
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Scheduled</span>;
      case 'completed':
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Completed</span>;
      case 'cancelled':
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">Cancelled</span>;
      case 'in_progress':
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">In Progress</span>;
      default:
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">{status}</span>;
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

          <Link
            href="/admin/dashboard"
            className="rounded-lg bg-[#357AFF] px-4 py-2 text-white hover:bg-[#2E69DE]"
          >
            Admin Dashboard
          </Link>
        </div>

        <h1 className="text-3xl font-bold text-gray-800 mb-6">Session Management</h1>

        {error && (
          <div className="mb-6 bg-red-50 p-4 rounded-lg text-red-600">
            {error}
          </div>
        )}

        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Counselor Filter */}
            <div className="w-full md:w-64">
              <select
                value={selectedCounselor ? "selected" : "all"}
                onChange={(e) => {
                  if (e.target.value === "all") {
                    setSelectedCounselor(null);
                  }
                }}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-700 focus:border-indigo-500 focus:outline-none"
              >
                <option value="all">All Counselors</option>
                {selectedCounselor && (
                  <option value="selected">{selectedCounselor.display_name}</option>
                )}
              </select>
            </div>

            {/* Counselor List */}
            {!selectedCounselor && (
              <div className="flex flex-wrap gap-2">
                {counselors.map((counselor) => (
                  <button
                    key={counselor.id}
                    onClick={() => setSelectedCounselor(counselor)}
                    className="rounded-full bg-white px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-100"
                  >
                    {counselor.display_name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Status Filter */}
          <div className="flex gap-2">
            <button
              onClick={() => setStatusFilter("all")}
              className={`px-3 py-1 rounded-lg text-sm ${
                statusFilter === "all"
                  ? "bg-indigo-600 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter("scheduled")}
              className={`px-3 py-1 rounded-lg text-sm ${
                statusFilter === "scheduled"
                  ? "bg-indigo-600 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              Scheduled
            </button>
            <button
              onClick={() => setStatusFilter("completed")}
              className={`px-3 py-1 rounded-lg text-sm ${
                statusFilter === "completed"
                  ? "bg-indigo-600 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              Completed
            </button>
            <button
              onClick={() => setStatusFilter("cancelled")}
              className={`px-3 py-1 rounded-lg text-sm ${
                statusFilter === "cancelled"
                  ? "bg-indigo-600 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              Cancelled
            </button>
          </div>
        </div>

        {/* Sessions Table */}
        <div className="bg-white rounded-xl shadow-xl overflow-hidden">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading sessions...</p>
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No sessions found</p>
              <p className="text-sm text-gray-400 mt-2">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date & Time
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Counselor
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Client
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Duration
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Video
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sessions.map((session) => (
                    <tr key={session.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formatDate(session.session_date)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {session.counselor?.display_name || "Unknown"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {session.client?.display_name || "Unknown"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{session.duration || 60} min</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(session.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {session.video_enabled ? (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Enabled</span>
                        ) : (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Disabled</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Summary Stats */}
        {!loading && sessions.length > 0 && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl shadow-md p-4">
              <h3 className="text-sm font-medium text-gray-500">Total Sessions</h3>
              <p className="mt-1 text-2xl font-semibold text-indigo-600">{sessions.length}</p>
            </div>

            <div className="bg-white rounded-xl shadow-md p-4">
              <h3 className="text-sm font-medium text-gray-500">Scheduled</h3>
              <p className="mt-1 text-2xl font-semibold text-blue-600">
                {sessions.filter(s => s.status === 'scheduled').length}
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-md p-4">
              <h3 className="text-sm font-medium text-gray-500">Completed</h3>
              <p className="mt-1 text-2xl font-semibold text-green-600">
                {sessions.filter(s => s.status === 'completed').length}
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-md p-4">
              <h3 className="text-sm font-medium text-gray-500">Cancelled</h3>
              <p className="mt-1 text-2xl font-semibold text-red-600">
                {sessions.filter(s => s.status === 'cancelled').length}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
