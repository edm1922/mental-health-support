"use client";
import React, { useState, useEffect } from "react";
import { useUser } from "@/utils/useUser";
import { supabase } from "@/utils/supabaseClient";
import VideoCall from "@/components/VideoCall";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function VideoSessionPage({ params }) {
  const { id: sessionId } = params;
  const router = useRouter();
  const { data: user, loading: userLoading } = useUser();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [roomUrl, setRoomUrl] = useState(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!userLoading && !user) {
      router.push("/account/signin?redirect=/counseling/session/" + sessionId + "/video");
    }
  }, [user, userLoading, router, sessionId]);

  useEffect(() => {
    if (user) {
      fetchSessionDetails();
    }
  }, [user, sessionId]);

  const fetchSessionDetails = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("counseling_sessions")
        .select("*, counselor:counselor_id(*), client:patient_id(*)")
        .eq("id", sessionId)
        .single();

      if (error) {
        throw error;
      }

      // Check if user is either the counselor or client for this session
      if (data.counselor_id !== user.id && data.patient_id !== user.id) {
        throw new Error("You do not have permission to access this session");
      }

      setSession(data);

      // If video room already exists, use it
      if (data.video_enabled && data.video_join_url) {
        setRoomUrl(data.video_join_url);
      }
    } catch (err) {
      console.error("Error fetching session:", err);
      setError(err.message || "Failed to load session details");
    } finally {
      setLoading(false);
    }
  };

  const createVideoRoom = async () => {
    try {
      setCreating(true);
      setError(null);

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

      const data = await response.json();
      setRoomUrl(data.roomUrl);

      // Refresh session details to get updated video info
      fetchSessionDetails();
    } catch (err) {
      console.error("Error creating video room:", err);
      setError(err.message || "Failed to create video room");
    } finally {
      setCreating(false);
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

  const isClient = session.client_id === user.id;
  const isCounselor = session.counselor_id === user.id;
  const otherParticipant = isClient ? session.counselor : session.client;
  const sessionDate = new Date(session.scheduled_time);
  const formattedDate = sessionDate.toLocaleDateString();
  const formattedTime = sessionDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/counseling/sessions"
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
          Back to Sessions
        </Link>

        <div className="mb-6 rounded-2xl bg-white p-6 shadow-xl md:p-8">
          <h1 className="mb-4 text-2xl font-bold text-gray-800">
            Video Session: {formattedDate} at {formattedTime}
          </h1>

          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-lg bg-gray-50 p-4">
              <h2 className="text-lg font-medium text-gray-700">
                {isClient ? "Your Counselor" : "Client"}
              </h2>
              <p className="mt-2 text-gray-600">
                {otherParticipant?.display_name || "Unknown"}
              </p>
            </div>

            <div className="rounded-lg bg-gray-50 p-4">
              <h2 className="text-lg font-medium text-gray-700">Session Status</h2>
              <p className="mt-2 text-gray-600">
                {session.status || "Scheduled"}
              </p>
            </div>
          </div>

          {!roomUrl && (
            <div className="mb-6 rounded-lg bg-blue-50 p-4 text-center">
              <p className="text-blue-700">
                No video room has been created for this session yet.
              </p>
              <button
                onClick={createVideoRoom}
                disabled={creating}
                className="mt-4 rounded-lg bg-[#357AFF] px-6 py-3 text-white hover:bg-[#2E69DE] disabled:opacity-50"
              >
                {creating ? "Creating Room..." : "Create Video Room"}
              </button>
            </div>
          )}

          {roomUrl && (
            <div className="h-[600px] rounded-lg border border-gray-200">
              <VideoCall
                roomUrl={roomUrl}
                userName={user.display_name || user.email}
                sessionId={sessionId}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
