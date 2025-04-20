"use client";
import React, { useState, useEffect } from "react";
import { useUser } from "@/utils/useUser";
import { supabase } from "@/utils/supabaseClient";
import Link from "next/link";

export default function CounselorSessionsPage() {
  const { data: user, loading: userLoading } = useUser();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState("upcoming"); // "upcoming", "past", "all"
  const [availability, setAvailability] = useState([]);
  const [isEditingAvailability, setIsEditingAvailability] = useState(false);
  const [newAvailability, setNewAvailability] = useState("");
  const [unreadMessages, setUnreadMessages] = useState({});

  useEffect(() => {
    if (user) {
      loadSessions();
      loadAvailability();
    }
  }, [user, statusFilter]);

  // Fetch unread message counts for each session
  useEffect(() => {
    if (user && sessions.length > 0) {
      fetchUnreadMessageCounts();
    }
  }, [user, sessions]);

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

      // First, check if the user is a counselor
      let profile;
      let profileError;

      // Try with id first
      const idResult = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      profile = idResult.data;
      profileError = idResult.error;

      // If there's an error, try with user_id
      if (profileError) {
        console.log('Error fetching profile by id, trying user_id');
        const userIdResult = await supabase
          .from('user_profiles')
          .select('role')
          .eq('user_id', user.id)
          .single();

        if (!userIdResult.error && userIdResult.data) {
          profile = userIdResult.data;
          profileError = null;
        }
      }

      if (profileError) {
        console.error('Profile error:', profileError);
        throw new Error('Failed to fetch user profile');
      }

      if (profile.role !== 'counselor') {
        throw new Error('Only counselors can access this page');
      }

      // Check if the counseling_sessions table exists and has the right structure
      const { data: tableInfo, error: tableError } = await supabase
        .from('information_schema.columns')
        .select('column_name')
        .eq('table_name', 'counseling_sessions');

      if (tableError) {
        console.error('Error checking table structure:', tableError);
      } else {
        console.log('Table structure:', tableInfo);

        // Check which columns exist
        const columnNames = tableInfo.map(col => col.column_name);
        console.log('Available columns:', columnNames);

        // Check if we have patient_id or client_id
        const hasPatientId = columnNames.includes('patient_id');
        const hasClientId = columnNames.includes('client_id');
        console.log('Has patient_id:', hasPatientId, 'Has client_id:', hasClientId);
      }

      // Build the query based on available columns
      let query;

      // Check which columns exist
      const columnNames = tableInfo ? tableInfo.map(col => col.column_name) : [];
      const hasPatientId = columnNames.includes('patient_id');
      const hasClientId = columnNames.includes('client_id');

      if (hasPatientId) {
        console.log('Using patient_id for join');
        query = supabase
          .from('counseling_sessions')
          .select(`
            *,
            client:patient_id(id, display_name)
          `)
          .eq('counselor_id', user.id);
      } else if (hasClientId) {
        console.log('Using client_id for join');
        query = supabase
          .from('counseling_sessions')
          .select(`
            *,
            client:client_id(id, display_name)
          `)
          .eq('counselor_id', user.id);
      } else {
        console.log('No patient_id or client_id column found, using basic query');
        query = supabase
          .from('counseling_sessions')
          .select('*')
          .eq('counselor_id', user.id);
      }

      // Add status filter
      const now = new Date().toISOString();

      if (statusFilter === "upcoming") {
        query = query.gte('session_date', now).order('session_date', { ascending: true });
      } else if (statusFilter === "past") {
        query = query.lt('session_date', now).order('session_date', { ascending: false });
      } else {
        query = query.order('session_date', { ascending: false });
      }

      // Execute the query
      try {
        const { data: sessionData, error: sessionsError } = await query;

        if (sessionsError) {
          // If the error is related to the relationship, try without it
          if (sessionsError.message.includes('relationship') || sessionsError.message.includes('schema cache')) {
            console.log('Relationship error, trying without relationship query');
            throw new Error('Relationship error');
          } else {
            console.error('Error fetching sessions:', sessionsError);
            throw new Error('Failed to fetch sessions');
          }
        }

        setSessions(sessionData || []);
      } catch (relationshipError) {
        if (relationshipError.message === 'Relationship error') {
          // If there was a relationship error, try without the relationship query
          const { data: basicSessionData, error: basicError } = await supabase
            .from('counseling_sessions')
            .select('*')
            .eq('counselor_id', user.id);

          if (basicError) {
            console.error('Error fetching sessions with basic query:', basicError);
            throw new Error('Failed to fetch sessions');
          }

          // If we have sessions, fetch the client details separately
          if (basicSessionData && basicSessionData.length > 0) {
            // Get unique patient/client IDs
            const patientIds = basicSessionData
              .map(session => session.patient_id || session.client_id)
              .filter(id => id); // Filter out null/undefined

            // Fetch user profiles for these IDs
            const { data: clientProfiles, error: clientError } = await supabase
              .from('user_profiles')
              .select('id, display_name, image_url')
              .in('id', patientIds);

            if (clientError) {
              console.error('Error fetching client profiles:', clientError);
            }

            // Create a map of client profiles
            const clientMap = {};
            if (clientProfiles) {
              clientProfiles.forEach(profile => {
                clientMap[profile.id] = profile;
              });
            }

            // Attach client profiles to sessions
            const sessionsWithClients = basicSessionData.map(session => ({
              ...session,
              client: clientMap[session.patient_id || session.client_id] || { display_name: 'Unknown Client' }
            }));

            setSessions(sessionsWithClients);
          } else {
            setSessions([]);
          }
        } else {
          // If it's another error, rethrow it
          throw relationshipError;
        }
      }
    } catch (err) {
      console.error("Error loading sessions:", err);
      setError(err.message || "Failed to load sessions");
    } finally {
      setLoading(false);
    }
  };

  const loadAvailability = async () => {
    try {
      // Get the current auth token
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        throw new Error('Authentication required');
      }

      // Get counselor profile
      let profile;
      let profileError;

      // Try with id first
      const idResult = await supabase
        .from('user_profiles')
        .select('availability_hours')
        .eq('id', user.id)
        .single();

      profile = idResult.data;
      profileError = idResult.error;

      // If there's an error, try with user_id
      if (profileError) {
        console.log('Error fetching profile by id, trying user_id');
        const userIdResult = await supabase
          .from('user_profiles')
          .select('availability_hours')
          .eq('user_id', user.id)
          .single();

        if (!userIdResult.error && userIdResult.data) {
          profile = userIdResult.data;
          profileError = null;
        }
      }

      if (profileError) {
        console.error('Profile error:', profileError);
        throw new Error('Failed to fetch counselor profile');
      }

      setAvailability(profile.availability_hours || "");
      setNewAvailability(profile.availability_hours || "");
    } catch (err) {
      console.error("Error loading availability:", err);
      setError(err.message || "Failed to load availability");
    }
  };

  const updateAvailability = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get the current auth token
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        throw new Error('Authentication required');
      }

      // First, check which field to use (id or user_id)
      let updateError;

      // Try with id first
      const { error: idUpdateError } = await supabase
        .from('user_profiles')
        .update({
          availability_hours: newAvailability,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      updateError = idUpdateError;

      // If there's an error, try with user_id
      if (updateError) {
        console.log('Error updating profile by id, trying user_id');
        const { error: userIdUpdateError } = await supabase
          .from('user_profiles')
          .update({
            availability_hours: newAvailability,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id);

        if (!userIdUpdateError) {
          updateError = null;
        }
      }

      if (updateError) {
        console.error('Update error:', updateError);
        throw new Error('Failed to update availability');
      }

      setAvailability(newAvailability);
      setIsEditingAvailability(false);
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

      // Get the current auth token
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        throw new Error('Authentication required');
      }

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

      // Get the current auth token
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        throw new Error('Authentication required');
      }

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

      // Get the current auth token
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        throw new Error('Authentication required');
      }

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

  // Fetch unread message counts for all sessions
  const fetchUnreadMessageCounts = async () => {
    try {
      // Create a temporary object to store counts
      const counts = {};

      // Check if the session_messages table exists
      const { data: tableExists, error: tableCheckError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_name', 'session_messages')
        .eq('table_schema', 'public')
        .single();

      if (tableCheckError || !tableExists) {
        console.log('Messages table does not exist yet');
        return;
      }

      // For each session, get the unread message count
      for (const session of sessions) {
        try {
          const response = await fetch(`/api/counseling/messages/unread-count?sessionId=${session.id}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json'
            },
            credentials: 'include'
          });

          if (response.ok) {
            const data = await response.json();
            if (data.success && data.count > 0) {
              counts[session.id] = data.count;
            }
          }
        } catch (err) {
          console.error(`Error fetching unread count for session ${session.id}:`, err);
          // Continue with other sessions
        }
      }

      // Update state with all counts at once
      setUnreadMessages(counts);
    } catch (err) {
      console.error('Error fetching unread message counts:', err);
      // Don't set error state as this is not critical
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
            href="/counselor/client-checkins"
            className="rounded-lg bg-[#357AFF] px-4 py-2 text-white hover:bg-[#2E69DE]"
          >
            View Client Check-ins
          </Link>
        </div>

        <h1 className="text-3xl font-bold text-gray-800 mb-6">Counseling Sessions</h1>

        {error && (
          <div className="mb-6 bg-red-50 p-4 rounded-lg text-red-600">
            {error}
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
                <div className="divide-y divide-gray-200">
                  {sessions.map((session) => (
                    <div key={session.id} className="p-4 hover:bg-gray-50">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="flex items-center">
                            <h3 className="text-lg font-medium text-gray-900">
                              Session with {session.client?.display_name || "Anonymous"}
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
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
