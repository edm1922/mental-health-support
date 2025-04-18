"use client";
import React, { useEffect, useState } from "react";
import { useUser } from '@/utils/useUser';
import { supabase } from '@/utils/supabaseClient';

function MainComponent() {
  const { data: user, loading: userLoading } = useUser();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedApp, setSelectedApp] = useState(null);

  useEffect(() => {
    async function loadApplications() {
      try {
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

        // Fetch counselor applications
        const token = (await supabase.auth.getSession()).data.session?.access_token;
        const response = await fetch("/api/admin/list-counselor-applications", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        if (data.error) {
          throw new Error(data.error);
        }

        setApplications(data.applications || []);
      } catch (err) {
        console.error("Error loading applications:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    if (user) {
      loadApplications();
    }
  }, [user]);

  const handleStatusUpdate = async (applicationId, status) => {
    try {
      setLoading(true);
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      const response = await fetch("/api/admin/counselor-applications/" + applicationId, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error("Failed to update application status");
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      setApplications((apps) =>
        apps.map((app) => (app.id === applicationId ? { ...app, status } : app))
      );
      setSelectedApp(null);
    } catch (err) {
      console.error(err);
      setError(err.message);
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
            href="/account/signin?redirect=/admin/counselor-applications"
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
          <h1 className="text-3xl font-bold text-gray-800">
            Counselor Applications
          </h1>
          <a
            href="/"
            className="bg-white text-gray-600 px-4 py-2 rounded-lg shadow-md hover:bg-gray-50 flex items-center gap-2"
          >
            Back to Home
          </a>
        </div>

        {error && (
          <div className="bg-red-50 text-red-500 p-4 rounded-lg mb-4">
            {error}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-xl p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Applications List
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
                          {app.display_name ||
                            app.name ||
                            app.email ||
                            "Anonymous"}
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
                      Name:{" "}
                      {selectedApp.display_name ||
                        selectedApp.name ||
                        "Not provided"}
                    </p>
                    <p className="text-gray-600">
                      Email: {selectedApp.email || "Not provided"}
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
                      Approve
                    </button>
                    <button
                      onClick={() =>
                        handleStatusUpdate(selectedApp.id, "rejected")
                      }
                      className="flex-1 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
                    >
                      Reject
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