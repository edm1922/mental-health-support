"use client";
import React, { useState, useEffect } from "react";
import { useUser } from "@/utils/useUser";
import { supabase } from "@/utils/supabaseClient";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  GlassContainer,
  GlassCard,
  BackButton,
  ModernButton,
  ModernTextarea,
  ModernHeading,
  ModernAlert,
  ModernEmoji,
  ModernCard,
  ModernSpinner
} from "@/components/ui/ModernUI";

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
      <GlassContainer className="flex items-center justify-center">
        <ModernSpinner size="large" />
      </GlassContainer>
    );
  }

  if (!user) {
    return (
      <GlassContainer className="flex flex-col items-center justify-center">
        <GlassCard className="w-full max-w-md text-center">
          <ModernHeading level={1}>Sign In Required</ModernHeading>
          <p className="mb-6 text-gray-600">
            Please sign in to access your mental health check-in.
          </p>
          <ModernButton
            onClick={() => window.location.href = "/account/signin"}
          >
            Sign In
          </ModernButton>
        </GlassCard>
      </GlassContainer>
    );
  }

  return (
    <GlassContainer>
      <BackButton />
      <GlassCard className="mb-8 backdrop-blur-md">
        <ModernHeading level={1} className="text-center">
          Mental Health Check-in
        </ModernHeading>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <label className="block text-lg font-medium text-gray-700">
              How are you feeling today?
            </label>
            <div className="flex justify-center space-x-6">
              {moodEmojis.map((emoji, index) => (
                <ModernEmoji
                  key={index}
                  emoji={emoji}
                  isSelected={moodRating === index + 1}
                  onClick={() => setMoodRating(index + 1)}
                />
              ))}
            </div>
            {moodRating > 0 && (
              <p className="text-center text-lg text-gray-600 animate-fadeIn">
                {moodMessages[moodRating]}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label className="block text-lg font-medium text-gray-700">
              Additional Notes
            </label>
            <ModernTextarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="How has your day been? (optional)"
              rows={4}
            />
          </div>

          {error && (
            <ModernAlert type="error">
              {error}
            </ModernAlert>
          )}

          {success && (
            <ModernAlert type="success">
              Check-in submitted successfully!
            </ModernAlert>
          )}

          <ModernButton
            type="submit"
            disabled={isSubmitting}
            className="w-full"
          >
            {isSubmitting ? "Submitting..." : "Submit Check-in"}
          </ModernButton>
        </form>
      </GlassCard>

      <GlassCard>
        <ModernHeading level={2}>
          Recent Check-ins
        </ModernHeading>
        {recentCheckins.length > 0 ? (
          <div className="space-y-4">
            {recentCheckins.map((checkin, index) => (
              <ModernCard
                key={checkin.id || index} // Use index as fallback if id is missing
                className="border border-gray-100 hover:border-blue-100 transition-all duration-300"
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
              </ModernCard>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-600 py-4">
            No recent check-ins yet.
          </p>
        )}
      </GlassCard>
    </GlassContainer>
  );
}

export default MainComponent;