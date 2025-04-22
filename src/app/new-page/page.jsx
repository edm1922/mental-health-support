"use client";
import React, { useState, useEffect } from "react";
import { useUser } from '@/utils/useUser';

function MainComponent() {
  const { data: user, loading } = useUser();
  const [userProfile, setUserProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetch("/api/user/profile")
        .then((res) => res.json())
        .then((data) => {
          setUserProfile(data.profile);
          setProfileLoading(false);
        })
        .catch((err) => {
          console.error("Failed to fetch user profile:", err);
          setProfileLoading(false);
        });
    }
  }, [user]);

  if (loading || (user && profileLoading)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-4xl mx-auto px-4 py-16">
          <div className="text-center space-y-6">
            <h1 className="text-4xl font-bold text-gray-900">
              Welcome to Mental Health Support
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              A safe space for mental health support, counseling, and community
              connection.
            </p>
            <div className="flex gap-4 justify-center mt-8">
              <a
                href="/account/signin"
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200 shadow-lg hover:shadow-xl"
              >
                Sign In
              </a>
              <a
                href="/account/signup"
                className="px-6 py-3 bg-white text-blue-600 border-2 border-blue-600 rounded-lg hover:bg-blue-50 transition duration-200"
              >
                Sign Up
              </a>
            </div>
            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="p-6 bg-white rounded-xl shadow-md hover:shadow-lg transition duration-200">
                <h3 className="text-lg font-semibold mb-2">
                  Professional Counseling
                </h3>
                <p className="text-gray-600">
                  Connect with licensed counselors for personalized support
                </p>
              </div>
              <div className="p-6 bg-white rounded-xl shadow-md hover:shadow-lg transition duration-200">
                <h3 className="text-lg font-semibold mb-2">
                  Community Support
                </h3>
                <p className="text-gray-600">
                  Join discussions and share experiences with others
                </p>
              </div>
              <div className="p-6 bg-white rounded-xl shadow-md hover:shadow-lg transition duration-200">
                <h3 className="text-lg font-semibold mb-2">Daily Check-ins</h3>
                <p className="text-gray-600">
                  Track your mental health journey with regular check-ins
                </p>
              </div>
            </div>
            <p className="mt-8 text-gray-600">
              Are you a mental health professional?{" "}
              <a
                href="/apply/counselor"
                className="text-blue-600 hover:text-blue-700 underline"
              >
                Apply to join as a counselor
              </a>
            </p>
          </div>
        </div>
      </div>
    );
  }

  const isCounselor = userProfile?.role === "counselor";

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome back, {userProfile?.display_name || user.name || "User"}
            </h1>
            <p className="text-gray-600 mt-2">How are you feeling today?</p>
          </div>
          <div className="flex items-center gap-4">
            {isCounselor && (
              <a
                href="/counselor/dashboard"
                className="px-4 py-2 text-[#357AFF] hover:text-[#2E69DE] flex items-center gap-2 rounded-lg hover:bg-blue-50 transition duration-200"
              >
                Counselor Dashboard
              </a>
            )}
            <a
              href="/account/logout"
              className="px-4 py-2 text-gray-600 hover:text-gray-900 flex items-center gap-2 rounded-lg hover:bg-gray-100 transition duration-200"
            >
              Sign Out
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {!isCounselor && (
            <>
              <a
                href="/mental-health-checkin"
                className="block p-6 bg-white rounded-xl shadow-md hover:shadow-lg transition duration-200"
              >
                <h2 className="text-xl font-semibold mb-2">Daily Check-in</h2>
                <p className="text-gray-600">
                  Record your mood and thoughts for today
                </p>
              </a>

              <a
                href="/book-session"
                className="block p-6 bg-white rounded-xl shadow-md hover:shadow-lg transition duration-200"
              >
                <h2 className="text-xl font-semibold mb-2">Book a Session</h2>
                <p className="text-gray-600">Schedule a counseling session</p>
              </a>
            </>
          )}

          <a
            href="/discussion"
            className="block p-6 bg-white rounded-xl shadow-md hover:shadow-lg transition duration-200"
          >
            <h2 className="text-xl font-semibold mb-2">Community</h2>
            <p className="text-gray-600">
              Join discussions and connect with others
            </p>
          </a>
        </div>
      </div>
    </div>
  );
}

export default MainComponent;