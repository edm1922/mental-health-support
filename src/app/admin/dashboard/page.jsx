"use client";
import React, { useState, useEffect } from "react";
import { useUser } from '@/utils/useUser';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabaseClient';
import Link from 'next/link';

function MainComponent() {
  const router = useRouter();
  const { data: user, loading: userLoading } = useUser();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [selectedApp, setSelectedApp] = useState(null);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    async function loadData() {
      if (user) {
        try {
          console.log("Checking admin status for user:", user.id);

          // First check if the user is an admin
          const adminResponse = await fetch("/api/admin/check-admin-status", {
            headers: {
              "Authorization": `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
            }
          });
          const adminData = await adminResponse.json();
          console.log("Admin check response:", adminData);

          if (!adminResponse.ok) {
            console.error("Admin check API error:", adminData);
            setError(`Admin check failed: ${adminData.error || 'Unknown error'}`);
            setLoading(false);
            return;
          }

          if (!adminData.isAdmin) {
            console.log("User is not an admin, showing access denied");
            setError("You do not have admin privileges. If you believe this is an error, please contact support.");
            setLoading(false);
            return;
          }

          console.log("User is confirmed as admin, fetching profile");

          // Get the user profile
          const profileResponse = await fetch("/api/get-basic-profile", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
            },
          });

          if (!profileResponse.ok) {
            throw new Error("Failed to fetch profile");
          }

          const profileData = await profileResponse.json();
          console.log("Profile data:", profileData);
          setProfile(profileData);

          // Fetch counselor applications
          console.log("Fetching counselor applications");
          try {
            const appResponse = await fetch("/api/admin/list-counselor-applications", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
              },
            });

            if (!appResponse.ok) {
              throw new Error(
                `Failed to fetch applications: ${appResponse.status} ${appResponse.statusText}`
              );
            }

            const appData = await appResponse.json();
            console.log("Applications data received:", appData);

            // Check for error in response
            if (appData.error) {
              throw new Error(appData.error);
            }

            // Ensure applications array exists
            const applications = appData.applications || [];
            console.log("Number of applications:", applications.length);

            setApplications(applications);
          } catch (appError) {
            console.error("Error fetching applications:", appError);
            setError("Failed to fetch applications: " + appError.message);
          }
        } catch (err) {
          console.error("Error in loadData:", err);
          setError(err.message);
        } finally {
          setLoading(false);
        }
      }
    }
    loadData();
  }, [user, router]);

  const handleStatusUpdate = async (applicationId, status) => {
    try {
      setLoading(true);
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      const response = await fetch(
        `/api/admin/counselor-applications/${applicationId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({ status }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update application status");
      }

      if (data.error) {
        throw new Error(data.error);
      }

      console.log(`Application ${applicationId} status updated to ${status}`);

      // Update the applications list with the new status
      setApplications((apps) =>
        apps.map((app) => (app.id === applicationId ? { ...app, status } : app))
      );

      // Update the selected app if it's still selected
      if (selectedApp && selectedApp.id === applicationId) {
        setSelectedApp({ ...selectedApp, status });
      }

      // Show success message
      setMessage(`Application ${status} successfully`);

      // Clear success message after 3 seconds
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      console.error("Error updating application status:", err);
      setError(err.message || "Failed to update application status");
    } finally {
      setLoading(false);
    }
  };

  if (userLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md w-full">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            Authentication Required
          </h1>
          <p className="text-gray-600 mb-6">
            Please sign in to access the admin dashboard.
          </p>
          <a
            href="/account/signin?redirect=/admin/dashboard"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Sign In
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
          <div className="flex gap-4">
            <Link
              href="/admin/counselor-applications"
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-indigo-700 flex items-center gap-2"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Counselor Applications
            </Link>
            <Link
              href="/admin/forum-moderation"
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-indigo-700 flex items-center gap-2"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
              Forum Moderation
            </Link>
            <Link
              href="/admin/database-management"
              className="bg-yellow-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-yellow-700 flex items-center gap-2"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
              </svg>
              Database Management
            </Link>
            <Link
              href="/"
              className="bg-white text-gray-600 px-4 py-2 rounded-lg shadow-md hover:bg-gray-50 flex items-center gap-2"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Home
            </Link>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-500 p-4 rounded-lg mb-4">
            {error}
          </div>
        )}

        {message && (
          <div className="bg-green-50 text-green-600 p-4 rounded-lg mb-4">
            {message}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-xl p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Counselor Applications
            </h2>
            <div className="space-y-4">
              {applications.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  No applications found
                </p>
              ) : (
                applications.map((app) => (
                  <div
                    key={app.id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                    onClick={() => setSelectedApp(app)}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-medium text-gray-800">
                          {app.display_name || app.user_profiles?.display_name || "Anonymous"}
                        </h3>
                        <p className="text-sm text-gray-500">
                          Applied:{" "}
                          {new Date(app.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-sm ${
                          app.status === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : app.status === "approved"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {app.status.charAt(0).toUpperCase() +
                          app.status.slice(1)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-xl p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Application Details
            </h2>
            {selectedApp ? (
              <div className="space-y-6">
                <div>
                  <h3 className="font-medium text-gray-700 mb-2">
                    Personal Information
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-600">
                      Name: {selectedApp.display_name || selectedApp.user_profiles?.display_name || "Not provided"}
                    </p>
                    <p className="text-gray-600">
                      Email: {selectedApp.email || selectedApp.user_profiles?.email || selectedApp.user_email || "Not provided"}
                    </p>
                    <p className="text-gray-600">
                      Phone: {selectedApp.phone || "Not provided"}
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-gray-700 mb-2">
                    Professional Details
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-600">
                      Years Experience: {selectedApp.years_experience}
                    </p>
                    <p className="text-gray-600">
                      Specializations: {selectedApp.specializations}
                    </p>
                    <p className="text-gray-600">
                      Credentials: {selectedApp.credentials}
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-gray-700 mb-2">Summary</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-600">{selectedApp.summary}</p>
                  </div>
                </div>

                {selectedApp.status === "pending" && (
                  <div className="flex gap-4 pt-4">
                    <button
                      onClick={() =>
                        handleStatusUpdate(selectedApp.id, "approved")
                      }
                      className="flex-1 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
                    >
                      Approve Application
                    </button>
                    <button
                      onClick={() =>
                        handleStatusUpdate(selectedApp.id, "rejected")
                      }
                      className="flex-1 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
                    >
                      Reject Application
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-center text-gray-500">
                Select an application to view details
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default MainComponent;