"use client";
import React, { useState, useEffect } from "react";
import { useUser } from "@/utils/useUser";
import { supabase } from "@/utils/supabaseClient";
import { useRouter } from "next/navigation";
import Link from "next/link";

function MainComponent() {
  const router = useRouter();
  const { data: user, loading: userLoading } = useUser();
  const [moodRating, setMoodRating] = useState(0);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [recentCheckins, setRecentCheckins] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const moodEmojis = ["😢", "😕", "😐", "🙂", "😊"];
  const moodMessages = {
    1: "It's okay to have tough days. Remember you're not alone.",
    2: "Tomorrow is a new day with new possibilities.",
    3: "You're doing alright! Keep taking care of yourself.",
    4: "Great to see you're feeling good! Keep the positive energy flowing!",
    5: "Wonderful! Your positive spirit brightens the day!",
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      setError("Please sign in to submit a check-in");
      return;
    }
    if (moodRating === 0) {
      setError("Please select a mood rating");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

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
          moodRating,
          notes: notes.trim() || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to submit check-in");
      }

      setSuccess(true);
      setMoodRating(0);
      setNotes("");
      fetchRecentCheckins();
    } catch (err) {
      setError("Failed to submit your check-in. Please try again.");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const fetchRecentCheckins = async () => {
    if (!user) return;
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
        throw new Error("Failed to fetch recent check-ins");
      }

      const data = await response.json();
      setRecentCheckins(data || []);
    } catch (err) {
      console.error("Error fetching recent check-ins:", err);
      setError("Failed to load previous check-ins");
    }
  };

  useEffect(() => {
    if (user) {
      fetchRecentCheckins();
    }
  }, [user]);

  if (userLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#357AFF] border-t-transparent"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-xl">
          <h1 className="mb-4 text-2xl font-bold text-gray-800">
            Sign In Required
          </h1>
          <p className="mb-6 text-gray-600">
            Please sign in to access your mental health check-in.
          </p>
          <a
            href="/account/signin"
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
        <Link href="/"
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
          Go Back
        </Link>
        <div className="mb-8 rounded-2xl bg-white p-6 shadow-xl md:p-8">
          <h1 className="mb-6 text-center text-3xl font-bold text-gray-800">
            Mental Health Check-in
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <label className="block text-lg font-medium text-gray-700">
                How are you feeling today?
              </label>
              <div className="flex justify-center space-x-4">
                {moodEmojis.map((emoji, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setMoodRating(index + 1)}
                    className={`text-4xl transition-transform hover:scale-110 ${
                      moodRating === index + 1 ? "scale-125" : ""
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
              {moodRating > 0 && (
                <p className="text-center text-lg text-gray-600">
                  {moodMessages[moodRating]}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-lg font-medium text-gray-700">
                Additional Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full rounded-lg border border-gray-200 p-4 focus:border-[#357AFF] focus:outline-none focus:ring-1 focus:ring-[#357AFF]"
                placeholder="How has your day been? (optional)"
                rows={4}
              />
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 p-4 text-red-500">
                {error}
              </div>
            )}

            {success && (
              <div className="rounded-lg bg-green-50 p-4 text-green-500">
                Check-in submitted successfully!
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-lg bg-[#357AFF] px-6 py-3 text-white transition-colors hover:bg-[#2E69DE] disabled:opacity-50"
            >
              {isSubmitting ? "Submitting..." : "Submit Check-in"}
            </button>
          </form>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-xl md:p-8">
          <h2 className="mb-6 text-2xl font-bold text-gray-800">
            Recent Check-ins
          </h2>
          {recentCheckins.length > 0 ? (
            <div className="space-y-4">
              {recentCheckins.map((checkin, index) => (
                <div
                  key={checkin.id || index} // Use index as fallback if id is missing
                  className="rounded-lg border border-gray-200 p-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-2xl">
                      {moodEmojis[(checkin.mood_rating || checkin.moodRating) - 1]}
                    </span>
                    <span className="text-sm text-gray-500">
                      {new Date(checkin.created_at || checkin.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {checkin.notes && (
                    <p className="mt-2 text-gray-600">{checkin.notes}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-600">
              No recent check-ins yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default MainComponent;