"use client";
import React, { useState, useEffect } from "react";
import { useUser } from "@/utils/useUser";
import { supabase } from "@/utils/supabaseClient";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function CounselorSessionsSimplePage() {
  const router = useRouter();
  const { data: user, loading: userLoading } = useUser();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCounselor, setIsCounselor] = useState(false);

  useEffect(() => {
    if (!userLoading && !user) {
      router.push("/account/signin?redirect=/counselor/sessions-simple");
    }
  }, [user, userLoading, router]);

  useEffect(() => {
    if (user) {
      checkCounselorStatus();
    }
  }, [user]);

  const checkCounselorStatus = async () => {
    try {
      // Check if the user is a counselor
      const { data: profile, error: profileError } = await supabase
        .from("user_profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profileError) {
        throw profileError;
      }

      if (profile?.role !== "counselor") {
        setError("You must be a counselor to access this page");
        setIsCounselor(false);
        setLoading(false);
        return;
      }

      setIsCounselor(true);
      fetchSessions();
    } catch (err) {
      console.error("Error checking counselor status:", err);
      setError("Failed to verify counselor status");
      setLoading(false);
    }
  };

  const fetchSessions = async () => {
    try {
      setLoading(true);
      console.log('Fetching sessions for counselor ID:', user.id);
      
      // Try to query the counseling_sessions table
      const { data, error } = await supabase
        .from("counseling_sessions")
        .select('*');
        
      if (error) {
        // If the table doesn't exist, show a specific error
        if (error.code.includes('42P01')) {
          throw new Error("The counseling_sessions table does not exist. Please ask an administrator to create it.");
        }
        throw error;
      }
      
      console.log('Found sessions:', data?.length || 0);
      
      // Filter sessions where the user is the counselor
      // Try both counselor_id and column_name fields
      const counselorSessions = data.filter(session => 
        session.counselor_id === user.id || 
        session.counselor_id === user.id.toString() ||
        session.column_name === user.id ||
        session.column_name === user.id.toString()
      );
      
      console.log('Filtered counselor sessions:', counselorSessions.length);
      
      if (counselorSessions.length > 0) {
        // Get unique patient IDs
        const patientIds = [...new Set(counselorSessions.map(session => 
          session.patient_id || session.client_id
        ))].filter(id => id); // Filter out null/undefined
        
        console.log('Patient IDs to fetch:', patientIds);
        
        // Fetch client profiles if we have patient IDs
        let clientProfiles = [];
        if (patientIds.length > 0) {
          const { data: profiles, error: clientError } = await supabase
            .from("user_profiles")
            .select('id, display_name, image_url')
            .in('id', patientIds);
            
          if (clientError) {
            console.error('Error fetching client profiles:', clientError);
          } else {
            clientProfiles = profiles || [];
          }
        }
        
        console.log('Found client profiles:', clientProfiles.length);
        
        // Create a map of client profiles for easy lookup
        const clientMap = {};
        clientProfiles.forEach(profile => {
          clientMap[profile.id] = profile;
        });
        
        // Attach client profiles to sessions and add compatibility fields
        const sessionsWithClients = counselorSessions.map(session => {
          const patientId = session.patient_id || session.client_id;
          const sessionDate = session.scheduled_for || session.session_date || session.created_at;
          
          return {
            ...session,
            // Add compatibility fields for the rest of the code
            client: clientMap[patientId] || { display_name: 'Unknown Client' },
            client_id: patientId,
            counselor_id: session.counselor_id || session.column_name,
            session_date: sessionDate
          };
        });
        
        setSessions(sessionsWithClients);
      } else {
        setSessions([]);
      }
    } catch (err) {
      console.error("Error fetching sessions:", err);
      setError("Failed to load sessions: " + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  const updateSessionStatus = async (sessionId, newStatus) => {
    try {
      console.log('Updating session status:', sessionId, newStatus);
      
      const { error } = await supabase
        .from("counseling_sessions")
        .update({ status: newStatus })
        .eq("id", sessionId);

      if (error) {
        throw error;
      }

      // Refresh the sessions list
      fetchSessions();
    } catch (err) {
      console.error("Error updating session status:", err);
      alert("Failed to update session status");
    }
  };

  if (userLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#357AFF] border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-xl">
          <h1 className="mb-4 text-2xl font-bold text-gray-800">Access Denied</h1>
          <p className="mb-6 text-red-600">{error}</p>
          <p className="mb-6 text-gray-600">
            This could be because you don't have any counseling sessions yet or because you don't have permission to view this page.
          </p>
          <div className="flex flex-col space-y-3">
            <Link
              href="/"
              className="inline-block rounded-lg bg-[#357AFF] px-6 py-3 text-white hover:bg-[#2E69DE]"
            >
              Back to Home
            </Link>
            {error && error.includes("table does not exist") && (
              <Link
                href="/admin/simple-create-table"
                className="inline-block rounded-lg border border-[#357AFF] px-6 py-3 text-[#357AFF] hover:bg-blue-50"
              >
                Create Counseling Table
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!isCounselor) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-xl">
          <h1 className="mb-4 text-2xl font-bold text-gray-800">Counselor Access Only</h1>
          <p className="mb-6 text-gray-600">
            This area is restricted to approved counselors.
          </p>
          <Link
            href="/counselor/apply"
            className="inline-block rounded-lg bg-[#357AFF] px-6 py-3 text-white hover:bg-[#2E69DE]"
          >
            Apply to Become a Counselor
          </Link>
        </div>
      </div>
    );
  }

  // Group sessions by upcoming and past
  const now = new Date();
  const upcomingSessions = sessions.filter(
    (session) => new Date(session.session_date) >= now
  );
  const pastSessions = sessions.filter(
    (session) => new Date(session.session_date) < now
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/"
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
          Back to Home
        </Link>

        <div className="mb-8 rounded-2xl bg-white p-6 shadow-xl md:p-8">
          <h1 className="mb-6 text-2xl font-bold text-gray-800">
            Your Counseling Sessions
          </h1>

          {sessions.length === 0 ? (
            <div className="mt-8 rounded-lg bg-gray-50 p-8 text-center">
              <p className="text-gray-600">
                You don't have any counseling sessions assigned yet.
              </p>
              <p className="mt-2 text-sm text-gray-500">
                Sessions will appear here when clients book appointments with you.
              </p>
            </div>
          ) : (
            <>
              {upcomingSessions.length > 0 && (
                <div className="mt-8">
                  <h2 className="mb-4 text-xl font-semibold text-gray-700">
                    Upcoming Sessions
                  </h2>
                  <div className="space-y-4">
                    {upcomingSessions.map((session) => {
                      const sessionDate = new Date(session.session_date);
                      const formattedDate = sessionDate.toLocaleDateString();
                      const formattedTime = sessionDate.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      });
                      const client = session.client;

                      return (
                        <div
                          key={session.id}
                          className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
                        >
                          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                            <div>
                              <div className="flex items-center gap-3">
                                <span className={`rounded-full px-3 py-1 text-xs font-medium ${
                                  session.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                                  session.status === 'ongoing' ? 'bg-green-100 text-green-800' :
                                  session.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {session.status || "Scheduled"}
                                </span>
                                <span className="text-sm text-gray-500">
                                  {formattedDate} at {formattedTime}
                                </span>
                              </div>
                              <h3 className="mt-2 text-lg font-medium text-gray-800">
                                Session with {client?.display_name || "Client"}
                              </h3>
                              {session.notes && (
                                <p className="mt-1 text-sm text-gray-600">
                                  {session.notes}
                                </p>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {session.video_enabled && (
                                <Link
                                  href={`/counseling/session/${session.id}/video`}
                                  className="rounded-lg bg-[#357AFF] px-4 py-2 text-white hover:bg-[#2E69DE]"
                                >
                                  Join Video Call
                                </Link>
                              )}
                              <Link
                                href={`/counseling/session/${session.id}`}
                                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-700 hover:bg-gray-50"
                              >
                                View Details
                              </Link>
                              <div className="relative group">
                                <button
                                  className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-700 hover:bg-gray-50"
                                >
                                  Update Status
                                </button>
                                <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 hidden group-hover:block z-10">
                                  <div className="py-1" role="menu" aria-orientation="vertical">
                                    <button
                                      onClick={() => updateSessionStatus(session.id, 'scheduled')}
                                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                      role="menuitem"
                                    >
                                      Mark as Scheduled
                                    </button>
                                    <button
                                      onClick={() => updateSessionStatus(session.id, 'ongoing')}
                                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                      role="menuitem"
                                    >
                                      Mark as Ongoing
                                    </button>
                                    <button
                                      onClick={() => updateSessionStatus(session.id, 'completed')}
                                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                      role="menuitem"
                                    >
                                      Mark as Completed
                                    </button>
                                    <button
                                      onClick={() => updateSessionStatus(session.id, 'cancelled')}
                                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                      role="menuitem"
                                    >
                                      Mark as Cancelled
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {pastSessions.length > 0 && (
                <div className="mt-8">
                  <h2 className="mb-4 text-xl font-semibold text-gray-700">
                    Past Sessions
                  </h2>
                  <div className="space-y-4">
                    {pastSessions.map((session) => {
                      const sessionDate = new Date(session.session_date);
                      const formattedDate = sessionDate.toLocaleDateString();
                      const formattedTime = sessionDate.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      });
                      const client = session.client;

                      return (
                        <div
                          key={session.id}
                          className="rounded-lg border border-gray-200 bg-gray-50 p-4"
                        >
                          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                            <div>
                              <div className="flex items-center gap-3">
                                <span className={`rounded-full px-3 py-1 text-xs font-medium ${
                                  session.status === 'completed' ? 'bg-green-100 text-green-800' :
                                  session.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {session.status || "Completed"}
                                </span>
                                <span className="text-sm text-gray-500">
                                  {formattedDate} at {formattedTime}
                                </span>
                              </div>
                              <h3 className="mt-2 text-lg font-medium text-gray-700">
                                Session with {client?.display_name || "Client"}
                              </h3>
                            </div>
                            <div className="flex gap-2">
                              <Link
                                href={`/counseling/session/${session.id}`}
                                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-700 hover:bg-gray-50"
                              >
                                View Summary
                              </Link>
                              {session.status !== 'completed' && (
                                <button
                                  onClick={() => updateSessionStatus(session.id, 'completed')}
                                  className="rounded-lg border border-green-300 bg-green-50 px-4 py-2 text-green-700 hover:bg-green-100"
                                >
                                  Mark Complete
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
