"use client";
import React, { useEffect, useState } from "react";
import { useUser } from '../utils/useUser'; // Import the useUser hook
import { useAuth } from '../utils/useAuth'; // Import the useAuth hook
import { supabase } from '../utils/supabaseClient'; // Import the supabase client
import CounselorSection, { CounselorApplicationSection } from '../components/CounselorSection';
import RoleBasedActionCards from '../components/RoleBasedActionCards';

function MainComponent() {
  const { user } = useUser(); // Correctly access the user property
  const { signOut } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      if (user) {
        try {
          // Get the current auth token
          const { data: { session } } = await supabase.auth.getSession();
          const token = session?.access_token;

          if (!token) {
            console.error('No access token available');
            return;
          }

          // Update last_active timestamp
          try {
            const lastActiveResponse = await fetch("/api/update-last-active", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
              },
            });

            if (!lastActiveResponse.ok) {
              console.warn('Failed to update last active timestamp');
            }
          } catch (lastActiveError) {
            console.warn('Error updating last active timestamp:', lastActiveError);
          }

          // Use the get-basic-profile endpoint that we know works
          const response = await fetch("/api/get-basic-profile", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`
            },
          });

          if (response.ok) {
            const data = await response.json();
            console.log('Profile data loaded:', data);
            setProfileData(data);

            // If user is admin, fetch applications with correct endpoint
            if (data.role === "admin") {
              const applicationsResponse = await fetch(
                "/api/admin/list-applications",
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                  },
                }
              );
              if (!applicationsResponse.ok) {
                throw new Error("Failed to fetch applications");
              }
              const applicationsData = await applicationsResponse.json();
              if (applicationsData.error) {
                throw new Error(applicationsData.error);
              }
            }
          } else {
            const errorData = await response.json();
            throw new Error(errorData.error || "Failed to load profile");
          }
        } catch (error) {
          console.error("Error loading profile:", error);
        }
      }
    }
    loadProfile();
  }, [user]);

  const handleSignOut = async () => {
    await signOut({
      callbackUrl: "/",
      redirect: true,
    });
  };

  const getAuthenticatedLink = (path) => {
    return user ? path : `/account/signin?callbackUrl=${path}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex-shrink-0 flex items-center">
              <a href="/" className="text-xl font-bold text-indigo-600">
                Mental Health Support
              </a>
            </div>

            <div className="flex items-center">
              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="flex items-center space-x-3 focus:outline-none"
                  >
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 border-2 border-indigo-600">
                      {profileData?.image_url ? (
                        <img
                          src={profileData.image_url}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <svg
                          className="h-full w-full text-gray-400 p-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                      )}
                    </div>
                    <span className="hidden md:block text-gray-700">
                      {profileData?.display_name || user.email}
                    </span>
                    <svg
                      className="h-5 w-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>

                  {showDropdown && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                      <a
                        href="/profile"
                        className="block px-4 py-2 border-b hover:bg-gray-100"
                      >
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {profileData?.display_name || user.email}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          {profileData?.bio || "No bio yet"}
                        </p>
                      </a>
                      {profileData?.role === "admin" && (
                        <>
                          <a
                            href="/admin/dashboard"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            Admin Dashboard
                          </a>
                          <a
                            href="/admin/create-counselor"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            Create Counselor
                          </a>
                          <a
                            href="/admin/create-test-session"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            Create Test Session
                          </a>
                          <a
                            href="/admin/view-all-sessions"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            View All Sessions
                          </a>
                          <a
                            href="/admin/fix-database"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            Fix Database
                          </a>
                        </>
                      )}
                      {profileData?.role === "counselor" && (
                        <a
                          href="/counselor/sessions"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          Counselor Sessions
                        </a>
                      )}
                      <a
                        href="/checkin"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        My Check-ins
                      </a>
                      <button
                        onClick={handleSignOut}
                        className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                      >
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex space-x-4">
                  {!user && (
                    <>
                      <a
                        href="/account/signin"
                        className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium"
                      >
                        Sign In
                      </a>
                      <a
                        href="/account/signup"
                        className="bg-indigo-600 text-white hover:bg-indigo-700 px-4 py-2 rounded-md text-sm font-medium"
                      >
                        Sign Up
                      </a>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-24 sm:px-8 sm:py-32">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMtNi42MjcgMC0xMiA1LjM3My0xMiAxMnM1LjM3MyAxMiAxMiAxMi01LjM3MyAxMi0xMi01LjM3My0xMi0xMi0xMnptLTEyLTJjLTcuNzMyIDAtMTQgNi4yNjgtMTQgMTRzNi4yNjggMTQgMTQgMTQgMTQtNi4yNjggMTQtMTQtNi4yNjgtMTQtMTQtMTR6IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9Ii4xIi8+PC9nPjwvc3ZnPg==')] opacity-10"></div>
        </div>
        <div className="relative mx-auto max-w-4xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">
            Welcome to Mental Health Support
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-100">
            Your journey to better mental health starts here. Connect with
            professional counselors and find the support you need.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-12 sm:px-8">
        {/* Counselor Section - Only visible to counselors */}
        <CounselorSection />

        {/* Counselor Application Section - Only visible to non-counselors */}
        <CounselorApplicationSection />

        {/* Role-based action cards */}
        <RoleBasedActionCards userRole={profileData?.role || 'user'} />

        {/* Removed the counselor application section as it's now a component */}

        <div className="mt-16">
          <h2 className="mb-8 text-center text-3xl font-bold text-gray-900">
            Educational Resources
          </h2>
          <div className="grid gap-8 md:grid-cols-2">
            <div className="rounded-xl bg-white p-6 shadow-lg">
              <div className="mb-4 inline-block rounded-full bg-green-100 p-3 text-green-600">
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  ></path>
                </svg>
              </div>
              <h3 className="mb-2 text-xl font-semibold text-gray-900">
                Mental Health Basics
              </h3>
              <p className="text-gray-600">
                Learn about mental health fundamentals and self-care practices.
              </p>
            </div>
            <div className="rounded-xl bg-white p-6 shadow-lg">
              <div className="mb-4 inline-block rounded-full bg-yellow-100 p-3 text-yellow-600">
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  ></path>
                </svg>
              </div>
              <h3 className="mb-2 text-xl font-semibold text-gray-900">
                Coping Strategies
              </h3>
              <p className="text-gray-600">
                Discover effective techniques for managing stress and anxiety.
              </p>
            </div>
          </div>
        </div>
      </div>

      <footer className="mt-16 bg-gray-900 px-6 py-12 text-center text-gray-300">
        <div className="mb-4 flex justify-center space-x-6">
          <a href="/supabase-test" className="text-blue-400 hover:text-blue-300 underline">Database Connection Test</a>
          {profileData?.role === "admin" && (
            <>
              <a href="/admin/create-counselor" className="text-blue-400 hover:text-blue-300 underline">Create Counselor</a>
              <a href="/admin/create-test-session" className="text-blue-400 hover:text-blue-300 underline">Create Test Session</a>
              <a href="/admin/view-all-sessions" className="text-blue-400 hover:text-blue-300 underline">View All Sessions</a>
              <a href="/admin/fix-database" className="text-blue-400 hover:text-blue-300 underline">Fix Database</a>
            </>
          )}
        </div>
        <p>© 2025 Mental Health Support. All rights reserved.</p>
      </footer>

      <style jsx global>{`
        @keyframes floatIn {
          0% {
            opacity: 0;
            transform: scale(0.95) translateY(-10px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        @keyframes floatOut {
          0% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
          100% {
            opacity: 0;
            transform: scale(0.95) translateY(-10px);
          }
        }

        .quote-float-in {
          animation: floatIn 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }

        .quote-float-out {
          animation: floatOut 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
      `}</style>
    </div>
  );
}

export default MainComponent;