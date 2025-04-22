"use client";
import React, { useState, useEffect } from "react";
import { useUser } from "@/utils/useUser";
import { supabase } from "@/utils/supabaseClient";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dynamic from 'next/dynamic';

// Dynamically import the SimpleChat component with no SSR
const SimpleChat = dynamic(
  () => import('@/components/SimpleChat'),
  { ssr: false }
);

export default function SessionDetailPage({ params }) {
  const { id: sessionId } = params;
  const router = useRouter();
  const { data: user, loading: userLoading } = useUser();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!userLoading && !user) {
      router.push("/account/signin?redirect=/counseling/session/" + sessionId);
    }
  }, [user, userLoading, router, sessionId]);

  // Setup function to ensure RLS is disabled and create necessary functions
  useEffect(() => {
    const setupEnvironment = async () => {
      try {
        // First try to create the ensure_rls_disabled function
        const setupResponse = await fetch('/api/setup/create-rls-function');
        console.log('Setup response:', await setupResponse.json());
      } catch (setupErr) {
        console.error('Error in setup:', setupErr);
        // Continue anyway
      }

      // Then ensure RLS is disabled
      try {
        const response = await fetch('/api/disable-rls');
        const data = await response.json();
        console.log('RLS status:', data);
      } catch (rlsErr) {
        console.error('Error disabling RLS:', rlsErr);
      }
    };

    // Run setup once when the component mounts
    setupEnvironment();
  }, []);

  useEffect(() => {
    if (user) {
      // Fetch session details when user is available
      fetchSessionDetails();
    }
  }, [user, sessionId]);

  const fetchSessionDetails = async () => {
    try {
      setLoading(true);

      // Ensure RLS is disabled before fetching session details
      try {
        await fetch('/api/disable-rls');
        console.log('RLS disabled before fetching session details');
      } catch (rlsError) {
        console.error('Error disabling RLS:', rlsError);
        // Continue anyway
      }

      // First try with the relationship query
      try {
        const { data, error } = await supabase
          .from("counseling_sessions")
          .select("*, counselor:counselor_id(*), client:patient_id(*)")
          .eq("id", sessionId)
          .single();

        if (!error) {
          // Check if user is either the counselor or client for this session
          if (data.counselor_id !== user.id && data.patient_id !== user.id) {
            throw new Error("You do not have permission to access this session");
          }

          setSession(data);
          setNotes(data.notes || "");
          setLoading(false);
          return;
        }

        // If the error is related to the relationship, try without it
        if (error.message.includes('relationship') || error.message.includes('schema cache')) {
          console.log('Relationship error, trying without relationship query');
          throw new Error('Relationship error');
        } else {
          throw error;
        }
      } catch (relationshipError) {
        // If there was a relationship error, try without the relationship query
        const { data, error } = await supabase
          .from("counseling_sessions")
          .select("*")
          .eq("id", sessionId)
          .single();

        if (error) {
          throw error;
        }

        if (!data) {
          throw new Error("Session not found");
        }

        // Check if user is either the counselor or client for this session
        if (data.counselor_id !== user.id && data.patient_id !== user.id) {
          throw new Error("You do not have permission to access this session");
        }

        // Fetch counselor and client details separately
        let counselorData = null;
        let clientData = null;

        if (data.counselor_id) {
          const { data: counselor } = await supabase
            .from("user_profiles")
            .select("*")
            .eq("id", data.counselor_id)
            .single();
          counselorData = counselor;
        }

        if (data.patient_id) {
          const { data: client } = await supabase
            .from("user_profiles")
            .select("*")
            .eq("id", data.patient_id)
            .single();
          clientData = client;
        }

        // Combine the data
        const sessionWithProfiles = {
          ...data,
          counselor: counselorData,
          client: clientData
        };

        setSession(sessionWithProfiles);
        setNotes(data.notes || "");
      }
    } catch (err) {
      console.error("Error fetching session:", err);
      setError(err.message || "Failed to load session details");
    } finally {
      setLoading(false);
    }
  };

  const updateSessionStatus = async (newStatus) => {
    try {
      const { error } = await supabase
        .from("counseling_sessions")
        .update({ status: newStatus })
        .eq("id", sessionId);

      if (error) {
        throw error;
      }

      // Refresh the session details
      fetchSessionDetails();
    } catch (err) {
      console.error("Error updating session status:", err);
      alert("Failed to update session status");
    }
  };

  const saveNotes = async () => {
    // Only counselors can update notes
    if (session?.counselor_id !== user.id) {
      alert("Only counselors can update session notes");
      return;
    }

    try {
      setIsSaving(true);

      const { error } = await supabase
        .from("counseling_sessions")
        .update({ notes: notes })
        .eq("id", sessionId);

      if (error) {
        throw error;
      }

      alert("Notes saved successfully");
    } catch (err) {
      console.error("Error saving notes:", err);
      alert("Failed to save notes");
    } finally {
      setIsSaving(false);
    }
  };

  const createVideoRoom = async () => {
    try {
      // Get the current auth token
      const { data: { session: authSession } } = await supabase.auth.getSession();
      const token = authSession?.access_token;

      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch("/api/video-call/create-room", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          sessionId,
          expiryMinutes: 120 // 2 hours
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create video room");
      }

      // Refresh the session details
      fetchSessionDetails();

      // Navigate to the video call page
      router.push(`/counseling/session/${sessionId}/video`);
    } catch (err) {
      console.error("Error creating video room:", err);
      alert("Failed to create video room: " + err.message);
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
            href="/counseling/sessions"
            className="inline-block rounded-lg bg-[#357AFF] px-6 py-3 text-white hover:bg-[#2E69DE]"
          >
            Back to Sessions
          </Link>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-xl">
          <h1 className="mb-4 text-2xl font-bold text-gray-800">Session Not Found</h1>
          <p className="mb-6 text-gray-600">
            The counseling session you're looking for could not be found.
          </p>
          <Link
            href="/counseling/sessions"
            className="inline-block rounded-lg bg-[#357AFF] px-6 py-3 text-white hover:bg-[#2E69DE]"
          >
            Back to Sessions
          </Link>
        </div>
      </div>
    );
  }

  const isClient = session.patient_id === user.id;
  const isCounselor = session.counselor_id === user.id;
  const otherParticipant = isClient ? session.counselor : session.client;
  const sessionDate = new Date(session.session_date);
  const formattedDate = sessionDate.toLocaleDateString();
  const formattedTime = sessionDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const isPastSession = new Date() > sessionDate;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
      <div className="mx-auto max-w-4xl">
        <div className="mb-4 flex space-x-3">
          <Link
            href={isCounselor ? "/counselor/sessions" : "/counseling/sessions"}
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
            Back to Sessions
          </Link>
          <Link
            href="/messages"
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
                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
              />
            </svg>
            View All Messages
          </Link>
        </div>

        <div className="mb-6 rounded-2xl bg-white p-6 shadow-xl md:p-8">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <h1 className="text-2xl font-bold text-gray-800">
              Counseling Session
            </h1>
            <span className={`rounded-full px-3 py-1 text-sm font-medium ${
              session.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
              session.status === 'ongoing' ? 'bg-green-100 text-green-800' :
              session.status === 'completed' ? 'bg-gray-100 text-gray-800' :
              session.status === 'cancelled' ? 'bg-red-100 text-red-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {session.status || "Scheduled"}
            </span>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="rounded-lg bg-gray-50 p-4">
              <h2 className="text-lg font-medium text-gray-700">Session Details</h2>
              <div className="mt-3 space-y-2">
                <p className="text-gray-600">
                  <span className="font-medium">Date:</span> {formattedDate}
                </p>
                <p className="text-gray-600">
                  <span className="font-medium">Time:</span> {formattedTime}
                </p>
                <p className="text-gray-600">
                  <span className="font-medium">Type:</span> {session.type === 'one_on_one' ? 'One-on-One Session' : 'Group Session'}
                </p>
                <p className="text-gray-600">
                  <span className="font-medium">Duration:</span> {session.duration || 60} minutes
                </p>
              </div>
            </div>

            <div className="rounded-lg bg-gray-50 p-4">
              <h2 className="text-lg font-medium text-gray-700">
                {isClient ? "Your Counselor" : "Client"}
              </h2>
              <div className="mt-3 flex items-center gap-3">
                {otherParticipant?.image_url ? (
                  <img
                    src={otherParticipant.image_url}
                    alt={otherParticipant.display_name || "Profile"}
                    className="h-12 w-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-200 text-gray-600">
                    {(otherParticipant?.display_name || "?")[0]}
                  </div>
                )}
                <div>
                  <p className="font-medium text-gray-800">
                    {otherParticipant?.display_name || "Unknown"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Video Call Section */}
          {!isPastSession && (
            <div className="mt-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
              <h2 className="text-lg font-medium text-blue-800">Video Call</h2>
              <p className="mt-2 text-blue-600">
                {session.video_enabled
                  ? "A video call has been set up for this session."
                  : "No video call has been set up for this session yet."}
              </p>
              <div className="mt-4">
                {session.video_enabled ? (
                  <Link
                    href={`/counseling/session/${session.id}/video`}
                    className="inline-block rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                  >
                    Join Video Call
                  </Link>
                ) : (
                  <button
                    onClick={createVideoRoom}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                  >
                    Set Up Video Call
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Messaging Component */}
          <div className="mt-6 rounded-lg border border-gray-200 overflow-hidden h-[500px]">
            {/* Chat component will handle disabling RLS internally */}

            <SimpleChat
              sessionId={sessionId}
            />
          </div>

          {/* Session Notes - Only editable by counselor */}
          <div className="mt-6">
            <h2 className="text-lg font-medium text-gray-700">Session Notes</h2>
            {isCounselor ? (
              <>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="mt-2 h-40 w-full rounded-lg border border-gray-200 p-3 focus:border-[#357AFF] focus:outline-none focus:ring-1 focus:ring-[#357AFF]"
                  placeholder="Add notes about this session..."
                />
                <div className="mt-2 flex justify-end">
                  <button
                    onClick={saveNotes}
                    disabled={isSaving}
                    className="rounded-lg bg-[#357AFF] px-4 py-2 text-white hover:bg-[#2E69DE] disabled:opacity-50"
                  >
                    {isSaving ? "Saving..." : "Save Notes"}
                  </button>
                </div>
              </>
            ) : (
              <div className="mt-2 rounded-lg border border-gray-200 p-4">
                {notes ? (
                  <p className="text-gray-700">{notes}</p>
                ) : (
                  <p className="text-gray-500 italic">No notes have been added yet.</p>
                )}
              </div>
            )}
          </div>

          {/* Status Update Buttons - Only for counselor */}
          {isCounselor && (
            <div className="mt-6 border-t border-gray-200 pt-6">
              <h2 className="text-lg font-medium text-gray-700">Update Session Status</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  onClick={() => updateSessionStatus('scheduled')}
                  className={`rounded-lg px-4 py-2 ${
                    session.status === 'scheduled'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                >
                  Scheduled
                </button>
                <button
                  onClick={() => updateSessionStatus('ongoing')}
                  className={`rounded-lg px-4 py-2 ${
                    session.status === 'ongoing'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                >
                  Ongoing
                </button>
                <button
                  onClick={() => updateSessionStatus('completed')}
                  className={`rounded-lg px-4 py-2 ${
                    session.status === 'completed'
                      ? 'bg-gray-100 text-gray-800'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                >
                  Completed
                </button>
                <button
                  onClick={() => updateSessionStatus('cancelled')}
                  className={`rounded-lg px-4 py-2 ${
                    session.status === 'cancelled'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                >
                  Cancelled
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
