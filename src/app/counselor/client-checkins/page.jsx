"use client";
import React, { useState, useEffect } from "react";
import { useUser } from "@/utils/useUser";
import { supabase } from "@/utils/supabaseClient";
import Link from "next/link";

export default function ClientCheckinsPage() {
  const { data: user, loading: userLoading } = useUser();
  const [clients, setClients] = useState([]);
  const [checkins, setCheckins] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState("week"); // "week", "month", "all"

  useEffect(() => {
    if (user) {
      loadClients();
    }
  }, [user]);

  useEffect(() => {
    if (selectedClient) {
      loadClientCheckins(selectedClient.id);
    }
  }, [selectedClient, dateRange]);

  const loadClients = async () => {
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

      // If there's an error, it might be because we're using id instead of user_id
      if (profileError) {
        console.log('Error fetching profile by id, trying user_id');
        const userIdResult = await supabase
          .from('user_profiles')
          .select('role')
          .eq('user_id', user.id)
          .single();

        if (!userIdResult.error && userIdResult.data) {
          // Use this profile instead
          profile = userIdResult.data;
          profileError = null;
        }
      }

      if (profileError) {
        throw new Error('Failed to fetch user profile');
      }

      if (profile.role !== 'counselor') {
        throw new Error('Only counselors can access this page');
      }

      // Get all counseling sessions for this counselor
      let sessions;
      let sessionsError;

      try {
        console.log('Fetching sessions for counselor ID:', user.id);

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

        // Check which columns exist
        const columnNames = tableInfo ? tableInfo.map(col => col.column_name) : [];
        const hasPatientId = columnNames.includes('patient_id');
        const hasClientId = columnNames.includes('client_id');

        let result;

        if (hasPatientId) {
          console.log('Using patient_id for query');
          result = await supabase
            .from('counseling_sessions')
            .select('patient_id')
            .eq('counselor_id', user.id)
            .order('created_at', { ascending: false });
        } else if (hasClientId) {
          console.log('Using client_id for query');
          result = await supabase
            .from('counseling_sessions')
            .select('client_id')
            .eq('counselor_id', user.id)
            .order('created_at', { ascending: false });

          // Map client_id to patient_id for consistency
          if (result.data && !result.error) {
            result.data = result.data.map(session => ({
              patient_id: session.client_id
            }));
          }
        } else {
          console.log('No patient_id or client_id column found');
          result = { data: [], error: null };
        }

        sessions = result.data;
        sessionsError = result.error;

        if (sessionsError) {
          console.error('Error fetching sessions:', sessionsError);
        } else {
          console.log('Found sessions:', sessions?.length || 0);
        }
      } catch (err) {
        console.error('Error fetching sessions:', err);
        throw new Error('Failed to fetch counseling sessions');
      }

      if (sessionsError) {
        console.error('Sessions error:', sessionsError);
        throw new Error('Failed to fetch counseling sessions');
      }

      // Extract unique client IDs
      const uniqueClientIds = sessions && sessions.length > 0
        ? [...new Set(sessions.map(session => session.patient_id))]
        : [];

      if (uniqueClientIds.length === 0) {
        setClients([]);
        setLoading(false);
        return;
      }

      // Get client profiles - try with id first
      let clientProfiles;
      let clientsError;

      const profileIdResult = await supabase
        .from('user_profiles')
        .select('id, display_name, bio, last_active')
        .in('id', uniqueClientIds);

      clientProfiles = profileIdResult.data;
      clientsError = profileIdResult.error;

      // If no profiles found or error, try with user_id
      if (clientsError || !clientProfiles || clientProfiles.length === 0) {
        console.log('No profiles found with id, trying user_id');
        const userIdResult = await supabase
          .from('user_profiles')
          .select('id, user_id, display_name, bio, last_active')
          .in('user_id', uniqueClientIds);

        if (!userIdResult.error && userIdResult.data && userIdResult.data.length > 0) {
          clientProfiles = userIdResult.data;
          clientsError = null;
        }
      }

      if (clientsError) {
        throw new Error('Failed to fetch client profiles');
      }

      setClients(clientProfiles || []);

      // Select the first client by default
      if (clientProfiles && clientProfiles.length > 0 && !selectedClient) {
        setSelectedClient(clientProfiles[0]);
      }
    } catch (err) {
      console.error("Error loading clients:", err);
      setError(err.message || "Failed to load clients");
    } finally {
      setLoading(false);
    }
  };

  const loadClientCheckins = async (clientId) => {
    try {
      setLoading(true);
      setError(null);

      // Get the current auth token
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        throw new Error('Authentication required');
      }

      // Calculate date range filter
      let dateFilter = null;
      const now = new Date();

      if (dateRange === "week") {
        const weekAgo = new Date();
        weekAgo.setDate(now.getDate() - 7);
        dateFilter = weekAgo.toISOString();
      } else if (dateRange === "month") {
        const monthAgo = new Date();
        monthAgo.setMonth(now.getMonth() - 1);
        dateFilter = monthAgo.toISOString();
      }

      // Try to find check-ins using both id and user_id fields
      let checkinData;
      let checkinError;

      // First try with user_id
      let query = supabase
        .from('mental_health_checkins')
        .select('*')
        .eq('user_id', clientId)
        .order('created_at', { ascending: false });

      // Add date filter if needed
      if (dateFilter) {
        query = query.gte('created_at', dateFilter);
      }

      // Execute the query
      const result = await query;
      checkinData = result.data;
      checkinError = result.error;

      // If no check-ins found, try with id field
      if (!checkinError && (!checkinData || checkinData.length === 0)) {
        console.log('No check-ins found with user_id, trying id');
        let idQuery = supabase
          .from('mental_health_checkins')
          .select('*')
          .eq('id', clientId)
          .order('created_at', { ascending: false });

        if (dateFilter) {
          idQuery = idQuery.gte('created_at', dateFilter);
        }

        const checkinIdResult = await idQuery;
        if (!checkinIdResult.error && checkinIdResult.data && checkinIdResult.data.length > 0) {
          checkinData = checkinIdResult.data;
        }
      }

      if (checkinError) {
        throw new Error('Failed to fetch client check-ins');
      }

      setCheckins(checkinData || []);
    } catch (err) {
      console.error("Error loading client check-ins:", err);
      setError(err.message || "Failed to load check-ins");
    } finally {
      setLoading(false);
    }
  };

  const getMoodEmoji = (rating) => {
    const emojis = ["😢", "😕", "😐", "🙂", "😊"];
    return emojis[Math.min(Math.max(0, rating - 1), 4)];
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
            href="/counselor/sessions"
            className="rounded-lg bg-[#357AFF] px-4 py-2 text-white hover:bg-[#2E69DE]"
          >
            View Sessions
          </Link>
        </div>

        <h1 className="text-3xl font-bold text-gray-800 mb-6">Client Check-ins</h1>

        {error && (
          <div className="mb-6 bg-red-50 p-4 rounded-lg text-red-600">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Client List */}
          <div className="bg-white rounded-xl shadow-xl p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Your Clients</h2>

            {loading && clients.length === 0 ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto"></div>
                <p className="mt-2 text-gray-500">Loading clients...</p>
              </div>
            ) : clients.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No clients found</p>
                <p className="text-sm text-gray-400 mt-2">You don't have any counseling sessions yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {clients.map((client) => (
                  <div
                    key={client.id}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedClient?.id === client.id
                        ? "bg-indigo-100 border-l-4 border-indigo-500"
                        : "bg-gray-50 hover:bg-gray-100"
                    }`}
                    onClick={() => setSelectedClient(client)}
                  >
                    <h3 className="font-medium text-gray-800">{client.display_name || "Anonymous"}</h3>
                    <p className="text-sm text-gray-500 truncate">{client.bio || "No bio provided"}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Check-ins */}
          <div className="bg-white rounded-xl shadow-xl p-6 md:col-span-3">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-800">
                {selectedClient ? `${selectedClient.display_name}'s Check-ins` : "Select a client"}
              </h2>

              <div className="flex space-x-2">
                <button
                  onClick={() => setDateRange("week")}
                  className={`px-3 py-1 rounded-md text-sm ${
                    dateRange === "week"
                      ? "bg-indigo-100 text-indigo-700"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  Last Week
                </button>
                <button
                  onClick={() => setDateRange("month")}
                  className={`px-3 py-1 rounded-md text-sm ${
                    dateRange === "month"
                      ? "bg-indigo-100 text-indigo-700"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  Last Month
                </button>
                <button
                  onClick={() => setDateRange("all")}
                  className={`px-3 py-1 rounded-md text-sm ${
                    dateRange === "all"
                      ? "bg-indigo-100 text-indigo-700"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  All Time
                </button>
              </div>
            </div>

            {!selectedClient ? (
              <div className="text-center py-12">
                <p className="text-gray-500">Select a client to view their check-ins</p>
              </div>
            ) : loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto"></div>
                <p className="mt-2 text-gray-500">Loading check-ins...</p>
              </div>
            ) : checkins.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No check-ins found for this time period</p>
              </div>
            ) : (
              <div className="space-y-4">
                {checkins.map((checkin) => (
                  <div key={checkin.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <span className="text-3xl mr-4">{getMoodEmoji(checkin.mood_rating)}</span>
                        <div>
                          <div className="font-medium">Mood Rating: {checkin.mood_rating}/5</div>
                          <div className="text-sm text-gray-500">{formatDate(checkin.created_at)}</div>
                        </div>
                      </div>

                      <div className="bg-white px-3 py-1 rounded-full text-xs font-medium">
                        {checkin.mood_rating <= 2 ? (
                          <span className="text-red-600">Needs Attention</span>
                        ) : checkin.mood_rating === 3 ? (
                          <span className="text-yellow-600">Neutral</span>
                        ) : (
                          <span className="text-green-600">Positive</span>
                        )}
                      </div>
                    </div>

                    {checkin.notes && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-gray-700">{checkin.notes}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
