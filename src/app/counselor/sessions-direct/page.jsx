"use client";
import React, { useState, useEffect } from "react";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Link from "next/link";

export default function DirectCounselorSessionsPage() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState("upcoming"); // "upcoming", "past", "all"
  const [availability, setAvailability] = useState("");
  const [isEditingAvailability, setIsEditingAvailability] = useState(false);
  const [newAvailability, setNewAvailability] = useState("");
  const [unreadMessages, setUnreadMessages] = useState({});
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 0
  });

  const supabase = createClientComponentClient();

  useEffect(() => {
    loadSessions();
  }, [statusFilter, pagination.page, pagination.pageSize]);

  const loadSessions = async () => {
    try {
      setLoading(true);
      setError(null);

      // Use the direct sessions API that bypasses authentication checks
      const response = await fetch(
        `/api/counselor/direct-sessions?status=${statusFilter}&page=${pagination.page}&pageSize=${pagination.pageSize}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to load sessions');
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to load sessions');
      }

      // Update all state at once
      setSessions(data.sessions || []);
      setUnreadMessages(data.unreadCounts || {});
      setAvailability(data.availability || '');
      setNewAvailability(data.availability || '');
      setPagination(data.pagination || pagination);
    } catch (err) {
      console.error("Error loading sessions:", err);
      setError(err.message || "Failed to load sessions");
    } finally {
      setLoading(false);
    }
  };

  const updateAvailability = async () => {
    try {
      setLoading(true);
      setError(null);

      // Create a simple API endpoint for updating availability
      const response = await fetch('/api/counselor/update-availability', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ availability: newAvailability }),
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update availability');
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to update availability');
      }

      setAvailability(newAvailability);
      setIsEditingAvailability(false);

      // Refresh sessions to get updated data
      loadSessions();
    } catch (err) {
      console.error("Error updating availability:", err);
      setError(err.message || "Failed to update availability");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusBadge = (session) => {
    const now = new Date();
    const sessionDate = new Date(session.session_date);

    if (session.status === 'cancelled') {
      return <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">Cancelled</span>;
    } else if (session.status === 'completed') {
      return <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Completed</span>;
    } else if (sessionDate < now) {
      return <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Past</span>;
    } else if (session.status === 'in_progress') {
      return <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">In Progress</span>;
    } else {
      return <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Scheduled</span>;
    }
  };

  const handleStartSession = async (sessionId) => {
    try {
      setLoading(true);
      setError(null);

      // Update the session status
      const { error: updateError } = await supabase
        .from('counseling_sessions')
        .update({
          status: 'in_progress',
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId);

      if (updateError) {
        throw new Error('Failed to start session');
      }

      // Refresh the sessions
      await loadSessions();
    } catch (err) {
      console.error("Error starting session:", err);
      setError(err.message || "Failed to start session");
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteSession = async (sessionId) => {
    try {
      setLoading(true);
      setError(null);

      // Update the session status
      const { error: updateError } = await supabase
        .from('counseling_sessions')
        .update({
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId);

      if (updateError) {
        throw new Error('Failed to complete session');
      }

      // Refresh the sessions
      await loadSessions();
    } catch (err) {
      console.error("Error completing session:", err);
      setError(err.message || "Failed to complete session");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSession = async (sessionId) => {
    try {
      setLoading(true);
      setError(null);

      // Update the session status
      const { error: updateError } = await supabase
        .from('counseling_sessions')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId);

      if (updateError) {
        throw new Error('Failed to cancel session');
      }

      // Refresh the sessions
      await loadSessions();
    } catch (err) {
      console.error("Error cancelling session:", err);
      setError(err.message || "Failed to cancel session");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/home"
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

          <div className="flex space-x-4">
            <Link
              href="/counselor/client-checkins"
              className="rounded-lg bg-[#357AFF] px-4 py-2 text-white hover:bg-[#2E69DE]"
            >
              View Client Check-ins
            </Link>
          </div>
        </div>

        <h1 className="text-3xl font-bold text-gray-800 mb-6">Counseling Sessions</h1>

        {error && (
          <div className="mb-6 bg-red-50 p-4 rounded-lg border border-red-200 shadow-sm">
            <div className="flex items-center mb-3">
              <svg className="h-6 w-6 text-red-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <h3 className="text-lg font-medium text-red-600">Error</h3>
            </div>
            <p className="text-red-600 mb-3">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Availability Card */}
          <div className="bg-white rounded-xl shadow-xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Your Availability</h2>
              {!isEditingAvailability ? (
                <button
                  onClick={() => setIsEditingAvailability(true)}
                  className="text-indigo-600 hover:text-indigo-800"
                >
                  Edit
                </button>
              ) : (
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      setIsEditingAvailability(false);
                      setNewAvailability(availability);
                    }}
                    className="text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={updateAvailability}
                    className="text-indigo-600 hover:text-indigo-800"
                  >
                    Save
                  </button>
                </div>
              )}
            </div>

            {isEditingAvailability ? (
              <textarea
                value={newAvailability}
                onChange={(e) => setNewAvailability(e.target.value)}
                className="w-full h-32 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Enter your availability hours (e.g., Monday-Friday: 9am-5pm)"
              ></textarea>
            ) : (
              <div className="bg-gray-50 p-4 rounded-lg">
                {availability ? (
                  <p className="whitespace-pre-line text-gray-700">{availability}</p>
                ) : (
                  <p className="text-gray-500 italic">No availability set. Click Edit to add your hours.</p>
                )}
              </div>
            )}
          </div>

          {/* Sessions List */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-xl shadow-xl overflow-hidden">
              <div className="border-b border-gray-200">
                <div className="flex">
                  <button
                    onClick={() => setStatusFilter("upcoming")}
                    className={`flex-1 py-3 px-4 text-center font-medium ${
                      statusFilter === "upcoming"
                        ? "text-indigo-600 border-b-2 border-indigo-600"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    Upcoming
                  </button>
                  <button
                    onClick={() => setStatusFilter("past")}
                    className={`flex-1 py-3 px-4 text-center font-medium ${
                      statusFilter === "past"
                        ? "text-indigo-600 border-b-2 border-indigo-600"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    Past
                  </button>
                  <button
                    onClick={() => setStatusFilter("all")}
                    className={`flex-1 py-3 px-4 text-center font-medium ${
                      statusFilter === "all"
                        ? "text-indigo-600 border-b-2 border-indigo-600"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    All
                  </button>
                </div>
              </div>

              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading sessions...</p>
                </div>
              ) : sessions.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">No sessions found</p>
                  <p className="text-sm text-gray-400 mt-2">
                    {statusFilter === "upcoming"
                      ? "You don't have any upcoming sessions"
                      : statusFilter === "past"
                      ? "You don't have any past sessions"
                      : "You don't have any sessions"}
                  </p>
                </div>
              ) : (
                <div>
                  <div className="divide-y divide-gray-200">
                    {sessions.map((session) => (
                      <div key={session.id} className="p-4 hover:bg-gray-50">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <div className="flex items-center">
                              <h3 className="text-lg font-medium text-gray-900">
                                Session with {session.client?.display_name ? session.client.display_name : `Patient #${session.patient_id?.substring(0, 8) || "Anonymous"}`}
                              </h3>
                              {unreadMessages[session.id] > 0 && (
                                <span className="ml-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                                  {unreadMessages[session.id]} new
                                </span>
                              )}
                            </div>
                            <p className="text-gray-600">{formatDate(session.session_date)}</p>
                          </div>
                          <div>
                            {getStatusBadge(session)}
                          </div>
                        </div>

                        <div className="flex justify-between items-center mt-4">
                          <div className="flex items-center space-x-4">
                            <div className="text-sm text-gray-500">
                              {session.duration || 60} minutes
                            </div>
                            {session.video_enabled && (
                              <div className="text-sm text-indigo-600">
                                Video Enabled
                              </div>
                            )}
                          </div>

                          <div className="flex space-x-2">
                            <Link
                              href={`/counseling/session/${session.id}`}
                              className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 flex items-center"
                            >
                              <span>View Details</span>
                              {unreadMessages[session.id] > 0 && (
                                <span className="ml-1 bg-red-500 text-white text-xs font-bold px-1.5 rounded-full">
                                  {unreadMessages[session.id]}
                                </span>
                              )}
                            </Link>
                            {session.status === 'scheduled' && new Date(session.session_date) > new Date() && (
                              <>
                                <button
                                  onClick={() => handleStartSession(session.id)}
                                  className="px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700"
                                >
                                  Start
                                </button>
                                <button
                                  onClick={() => handleCancelSession(session.id)}
                                  className="px-3 py-1 bg-red-600 text-white text-sm rounded-md hover:bg-red-700"
                                >
                                  Cancel
                                </button>
                              </>
                            )}

                            {session.status === 'in_progress' && (
                              <button
                                onClick={() => handleCompleteSession(session.id)}
                                className="px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700"
                              >
                                Complete
                              </button>
                            )}

                            {session.video_enabled && session.video_join_url && (session.status === 'scheduled' || session.status === 'in_progress') && (
                              <a
                                href={session.video_join_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3 py-1 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700"
                              >
                                Join Video
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pagination Controls */}
                  {pagination.totalPages > 1 && (
                    <div className="flex justify-between items-center border-t border-gray-200 px-4 py-3 sm:px-6">
                      <div className="flex-1 flex justify-between sm:hidden">
                        <button
                          onClick={() => setPagination({...pagination, page: Math.max(1, pagination.page - 1)})}
                          disabled={pagination.page === 1}
                          className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${pagination.page === 1 ? 'bg-gray-100 text-gray-400' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                        >
                          Previous
                        </button>
                        <button
                          onClick={() => setPagination({...pagination, page: Math.min(pagination.totalPages, pagination.page + 1)})}
                          disabled={pagination.page === pagination.totalPages}
                          className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${pagination.page === pagination.totalPages ? 'bg-gray-100 text-gray-400' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                        >
                          Next
                        </button>
                      </div>
                      <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm text-gray-700">
                            Showing <span className="font-medium">{((pagination.page - 1) * pagination.pageSize) + 1}</span> to <span className="font-medium">{Math.min(pagination.page * pagination.pageSize, pagination.total)}</span> of{' '}
                            <span className="font-medium">{pagination.total}</span> results
                          </p>
                        </div>
                        <div>
                          <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                            <button
                              onClick={() => setPagination({...pagination, page: Math.max(1, pagination.page - 1)})}
                              disabled={pagination.page === 1}
                              className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${pagination.page === 1 ? 'text-gray-300' : 'text-gray-500 hover:bg-gray-50'}`}
                            >
                              <span className="sr-only">Previous</span>
                              <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </button>

                            {/* Page numbers */}
                            {[...Array(pagination.totalPages).keys()].map((x) => {
                              const pageNumber = x + 1;
                              return (
                                <button
                                  key={pageNumber}
                                  onClick={() => setPagination({...pagination, page: pageNumber})}
                                  className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${pagination.page === pageNumber ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600' : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'}`}
                                >
                                  {pageNumber}
                                </button>
                              );
                            })}

                            <button
                              onClick={() => setPagination({...pagination, page: Math.min(pagination.totalPages, pagination.page + 1)})}
                              disabled={pagination.page === pagination.totalPages}
                              className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${pagination.page === pagination.totalPages ? 'text-gray-300' : 'text-gray-500 hover:bg-gray-50'}`}
                            >
                              <span className="sr-only">Next</span>
                              <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                              </svg>
                            </button>
                          </nav>
                        </div>
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
