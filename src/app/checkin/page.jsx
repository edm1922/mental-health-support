"use client";
import React, { useState, useEffect } from "react";
import { useUser } from "@/utils/useUser";
import { supabase } from "@/utils/supabaseClient";

function MainComponent() {
  const { data: user, loading: userLoading } = useUser();
  const [mood, setMood] = useState(3);
  const [notes, setNotes] = useState("");
  const [checkins, setCheckins] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [loadingCheckins, setLoadingCheckins] = useState(true);

  useEffect(() => {
    if (user) {
      fetchCheckins();
    }
  }, [user]);

  const fetchCheckins = async () => {
    try {
      // Get the current auth token
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        console.error('No access token available');
        throw new Error('Authentication required');
      }

      const response = await fetch("/api/mental-health/recent-checkins", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error("Failed to fetch check-ins");
      }

      const data = await response.json();
      setCheckins(data || []);
    } catch (error) {
      console.error("Error fetching check-ins:", error);
      setError("Failed to load previous check-ins");
    } finally {
      setLoadingCheckins(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Get the current auth token
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        console.error('No access token available');
        throw new Error('Authentication required');
      }

      const response = await fetch("/api/mental-health/checkin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          moodRating: mood,
          notes,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to submit check-in");
      }

      await fetchCheckins();
      setNotes("");
      setMood(3);
    } catch (error) {
      console.error("Error submitting check-in:", error);
      setError(error.message || "Failed to submit check-in");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (userLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#357AFF] border-t-transparent"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-xl">
          <h1 className="mb-4 text-2xl font-bold text-gray-800">
            Sign In Required
          </h1>
          <p className="mb-6 text-gray-600">
            Please sign in to access your daily check-ins.
          </p>
          <a
            href={`/account/signin?callbackUrl=${encodeURIComponent(
              "/checkin"
            )}`}
            className="inline-block rounded-lg bg-[#357AFF] px-6 py-3 text-white hover:bg-[#2E69DE]"
          >
            Sign In
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
      <div className="mx-auto max-w-4xl">
        <button
          onClick={() => window.history.back()}
          className="mb-4 flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-gray-600 shadow-md hover:bg-gray-50"
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
          Go Back
        </button>

        <div className="mb-8 rounded-2xl bg-white p-8 shadow-xl">
          <h1 className="mb-6 text-center text-3xl font-bold text-gray-800">
            Daily Mental Health Check-in
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <label className="block text-lg font-medium text-gray-700">
                How are you feeling today?
              </label>
              <div className="flex justify-between gap-4">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setMood(value)}
                    className={`flex h-16 w-16 items-center justify-center rounded-full text-2xl transition-all ${
                      mood === value
                        ? "bg-[#357AFF] text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {value === 1 && "😢"}
                    {value === 2 && "😕"}
                    {value === 3 && "😐"}
                    {value === 4 && "🙂"}
                    {value === 5 && "😄"}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-lg font-medium text-gray-700">
                Additional Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="h-32 w-full rounded-lg border border-gray-200 p-3 focus:border-[#357AFF] focus:outline-none focus:ring-1 focus:ring-[#357AFF]"
                placeholder="How are you feeling? What's on your mind?"
              />
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 p-4 text-red-500">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-lg bg-[#357AFF] px-6 py-3 text-white transition-colors hover:bg-[#2E69DE] focus:outline-none focus:ring-2 focus:ring-[#357AFF] focus:ring-offset-2 disabled:opacity-50"
            >
              {isSubmitting ? "Submitting..." : "Submit Check-in"}
            </button>
          </form>
        </div>

        <div className="rounded-2xl bg-white p-8 shadow-xl">
          <h2 className="mb-6 text-2xl font-bold text-gray-800">
            Previous Check-ins
          </h2>

          {loadingCheckins ? (
            <div className="flex justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#357AFF] border-t-transparent"></div>
            </div>
          ) : checkins.length === 0 ? (
            <p className="text-center text-gray-600">
              No previous check-ins found.
            </p>
          ) : (
            <div className="space-y-4">
              {checkins.map((checkin) => (
                <div
                  key={checkin.id}
                  className="rounded-lg border border-gray-200 p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">
                        {checkin.mood_rating === 1 && "😢"}
                        {checkin.mood_rating === 2 && "😕"}
                        {checkin.mood_rating === 3 && "😐"}
                        {checkin.mood_rating === 4 && "🙂"}
                        {checkin.mood_rating === 5 && "😄"}
                      </span>
                      <span className="text-sm text-gray-500">
                        {new Date(checkin.created_at).toLocaleDateString(
                          "en-US",
                          {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          }
                        )}
                      </span>
                    </div>
                  </div>
                  {checkin.notes && (
                    <p className="mt-2 text-gray-700">{checkin.notes}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MainComponent;