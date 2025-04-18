"use client";
import React, { useState, useEffect } from "react";
import { useUser } from "@/utils/useUser";
import { supabase } from "@/utils/supabaseClient";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SessionsPage() {
  const router = useRouter();
  const { data: user, loading: userLoading } = useUser();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userLoading && !user) {
      router.push("/account/signin?redirect=/counseling/sessions");
    }
  }, [user, userLoading, router]);

  useEffect(() => {
    if (user) {
      fetchSessions();
    }
  }, [user]);

  const fetchSessions = async () => {
    try {
      setLoading(true);

      // Get sessions where the user is either the counselor or the patient
      console.log('Fetching sessions for user ID:', user.id);

      // First, get all sessions
      const { data, error } = await supabase
        .from("counseling_sessions")
        .select('*')
        .or(`counselor_id.eq.${user.id.toString()},patient_id.eq.${user.id.toString()}`)
        .order("scheduled_for", { ascending: true });

      if (error) {
        console.error('Error in initial query:', error);
        throw error;
      }

      console.log('Found sessions:', data?.length || 0);

      // If we have sessions, fetch the counselor and patient details separately
      if (data && data.length > 0) {
        // Get unique counselor and patient IDs
        const counselorIds = [...new Set(data.map(session => session.counselor_id))];
        const patientIds = [...new Set(data.map(session => session.patient_id))];
        const allUserIds = [...new Set([...counselorIds, ...patientIds])];

        console.log('User IDs to fetch:', allUserIds);

        // Fetch user profiles
        const { data: userProfiles, error: profileError } = await supabase
          .from("user_profiles")
          .select('id, display_name, image_url')
          .in('id', allUserIds);

        if (profileError) {
          console.error('Error fetching user profiles:', profileError);
        }

        console.log('Found user profiles:', userProfiles?.length || 0);

        // Create a map of user profiles for easy lookup
        const userMap = {};
        if (userProfiles) {
          userProfiles.forEach(profile => {
            userMap[profile.id] = profile;
          });
        }

        // Attach profiles to sessions
        const sessionsWithProfiles = data.map(session => ({
          ...session,
          counselor: userMap[session.counselor_id] || { display_name: 'Unknown Counselor' },
          client: userMap[session.patient_id] || { display_name: 'Unknown Client' },
          // Add compatibility fields
          client_id: session.patient_id,
          session_date: session.scheduled_for
        }));

        setSessions(sessionsWithProfiles);
        return;
      }

      // If no sessions or error already handled above
      setSessions([]);
    } catch (err) {
      console.error("Error fetching sessions:", err);
      setError("Failed to load sessions: " + (err.message || err));
    } finally {
      setLoading(false);
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
          <h1 className="mb-4 text-2xl font-bold text-gray-800">Error</h1>
          <p className="mb-6 text-red-600">{error}</p>
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

  // Group sessions by upcoming and past
  const now = new Date();
  const upcomingSessions = sessions.filter(
    (session) => new Date(session.scheduled_for || session.session_date) >= now
  );
  const pastSessions = sessions.filter(
    (session) => new Date(session.scheduled_for || session.session_date) < now
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
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-800">
              Your Counseling Sessions
            </h1>
            <Link
              href="/book-session"
              className="rounded-lg bg-[#357AFF] px-4 py-2 text-white hover:bg-[#2E69DE]"
            >
              Book New Session
            </Link>
          </div>

          {sessions.length === 0 ? (
            <div className="mt-8 rounded-lg bg-gray-50 p-8 text-center">
              <p className="text-gray-600">
                You don't have any counseling sessions yet.
              </p>
              <Link
                href="/book-session"
                className="mt-4 inline-block rounded-lg bg-[#357AFF] px-6 py-3 text-white hover:bg-[#2E69DE]"
              >
                Book Your First Session
              </Link>
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
                      const sessionDate = new Date(session.scheduled_for || session.session_date);
                      const formattedDate = sessionDate.toLocaleDateString();
                      const formattedTime = sessionDate.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      });
                      const isClient = session.patient_id === user.id || session.client_id === user.id;
                      const otherPerson = isClient
                        ? session.counselor
                        : session.client;

                      return (
                        <div
                          key={session.id}
                          className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
                        >
                          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                            <div>
                              <div className="flex items-center gap-3">
                                <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800">
                                  {session.status || "Scheduled"}
                                </span>
                                <span className="text-sm text-gray-500">
                                  {formattedDate} at {formattedTime}
                                </span>
                              </div>
                              <h3 className="mt-2 text-lg font-medium text-gray-800">
                                Session with{" "}
                                {otherPerson?.display_name || "Unknown"}
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
                      const sessionDate = new Date(session.scheduled_for || session.session_date);
                      const formattedDate = sessionDate.toLocaleDateString();
                      const formattedTime = sessionDate.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      });
                      const isClient = session.patient_id === user.id || session.client_id === user.id;
                      const otherPerson = isClient
                        ? session.counselor
                        : session.client;

                      return (
                        <div
                          key={session.id}
                          className="rounded-lg border border-gray-200 bg-gray-50 p-4"
                        >
                          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                            <div>
                              <div className="flex items-center gap-3">
                                <span className="rounded-full bg-gray-200 px-3 py-1 text-xs font-medium text-gray-800">
                                  {session.status || "Completed"}
                                </span>
                                <span className="text-sm text-gray-500">
                                  {formattedDate} at {formattedTime}
                                </span>
                              </div>
                              <h3 className="mt-2 text-lg font-medium text-gray-700">
                                Session with{" "}
                                {otherPerson?.display_name || "Unknown"}
                              </h3>
                            </div>
                            <Link
                              href={`/counseling/session/${session.id}`}
                              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-700 hover:bg-gray-50"
                            >
                              View Summary
                            </Link>
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
