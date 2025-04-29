"use client";
// NOTE: This form is being deprecated. Please use /counselor/apply instead.
// A redirect has been added to automatically send users to the new form.
import React, { useState, useEffect, Suspense } from "react";
import dynamic from 'next/dynamic';

// Dynamically import hooks with no SSR
const UserProvider = dynamic(() => import('@/utils/useUser').then(mod => {
  const { useUser } = mod;
  return props => {
    const userState = useUser();
    return props.children(userState);
  };
}), { ssr: false });

function MainComponent({ user, userLoading }) {
  // Redirect to the new form path
  useEffect(() => {
    window.location.href = '/counselor/apply';
  }, []);
  const [formData, setFormData] = useState({
    credentials: "",
    yearsExperience: "",
    specializations: "",
    summary: "",
    phone: "",
    licenseUrl: "",
    acceptTerms: false,
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [applicationStatus, setApplicationStatus] = useState(null);

  useEffect(() => {
    if (user) {
      fetch("/api/counselor/application-status", {
        method: "POST",
      })
        .then((res) => {
          if (!res.ok) throw new Error("Failed to fetch status");
          return res.json();
        })
        .then((data) => {
          if (data.status && data.status !== "not_found") {
            setApplicationStatus(data.status);
          }
        })
        .catch((err) => {
          console.error("Failed to fetch application status:", err);
        });
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // No longer using file upload functionality

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    console.log("Starting form submission with data:", formData);

    try {
      if (!formData.acceptTerms) {
        throw new Error("Please accept the terms and conditions");
      }

      // Just use the URL if provided
      const licenseUrl = formData.licenseUrl || '';

      console.log("Submitting application with license URL:", licenseUrl);
      const response = await fetch("/api/counselor/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          credentials: formData.credentials,
          yearsExperience: parseInt(formData.yearsExperience),
          specializations: formData.specializations,
          summary: formData.summary,
          phone: formData.phone,
          licenseUrl,
        }),
      });

      const data = await response.json();
      console.log("Server response:", data);

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit application");
      }

      setSuccess(true);
      setTimeout(() => {
        window.location.href = "/";
      }, 3000);
    } catch (err) {
      console.error("Form submission error:", err);
      // Show a generic error message
      const errorMessage = err.message || "Failed to submit application";
      setError(errorMessage);
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
            Please sign in to apply as a counselor.
          </p>
          <a
            href={`/account/signin?callbackUrl=${encodeURIComponent(
              "/apply/counselor"
            )}`}
            className="inline-block rounded-lg bg-[#357AFF] px-6 py-3 text-white hover:bg-[#2E69DE]"
          >
            Sign In
          </a>
        </div>
      </div>
    );
  }

  if (applicationStatus) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-xl">
          <h1 className="mb-4 text-2xl font-bold text-gray-800">
            Application Status
          </h1>
          <p className="mb-6 text-gray-600">
            Your application is currently {applicationStatus}
          </p>
          <a
            href="/"
            className="inline-block rounded-lg bg-[#357AFF] px-6 py-3 text-white hover:bg-[#2E69DE]"
          >
            Return Home
          </a>
        </div>
      </div>
    );
  }

  // Add a key to force re-render
  const formVersion = "v2";

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
      <div className="mx-auto max-w-2xl">
        <a
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
        </a>
        <div className="rounded-2xl bg-white p-8 shadow-xl">
          <h1 className="mb-6 text-center text-3xl font-bold text-gray-800">
            Counselor Application
          </h1>

          <form key={formVersion} onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Professional Credentials/Licenses
              </label>
              <input
                type="text"
                name="credentials"
                value={formData.credentials}
                onChange={handleInputChange}
                className="w-full rounded-lg border border-gray-200 p-3 focus:border-[#357AFF] focus:outline-none focus:ring-1 focus:ring-[#357AFF]"
                required
                placeholder="e.g., Licensed Clinical Social Worker (LCSW)"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Years of Experience
              </label>
              <input
                type="number"
                name="yearsExperience"
                value={formData.yearsExperience}
                onChange={handleInputChange}
                min="0"
                className="w-full rounded-lg border border-gray-200 p-3 focus:border-[#357AFF] focus:outline-none focus:ring-1 focus:ring-[#357AFF]"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Areas of Specialization
              </label>
              <textarea
                name="specializations"
                value={formData.specializations}
                onChange={handleInputChange}
                className="h-32 w-full rounded-lg border border-gray-200 p-3 focus:border-[#357AFF] focus:outline-none focus:ring-1 focus:ring-[#357AFF]"
                required
                placeholder="List your areas of expertise (e.g., Anxiety, Depression, Trauma)"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Professional Summary
              </label>
              <textarea
                name="summary"
                value={formData.summary}
                onChange={handleInputChange}
                className="h-32 w-full rounded-lg border border-gray-200 p-3 focus:border-[#357AFF] focus:outline-none focus:ring-1 focus:ring-[#357AFF]"
                required
                placeholder="Brief description of your professional background and approach"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full rounded-lg border border-gray-200 p-3 focus:border-[#357AFF] focus:outline-none focus:ring-1 focus:ring-[#357AFF]"
                placeholder="(Optional) For verification purposes"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                License/Certification URL (Optional)
              </label>
              <input
                type="url"
                name="licenseUrl"
                value={formData.licenseUrl}
                onChange={handleInputChange}
                className="w-full rounded-lg border border-gray-200 p-3 focus:border-[#357AFF] focus:outline-none focus:ring-1 focus:ring-[#357AFF]"
                placeholder="Link to verify your credentials (e.g., LinkedIn profile)"
              />
              <p className="text-xs text-gray-500">
                Provide a URL to your credentials or license verification (LinkedIn profile, professional directory listing, etc.)
              </p>
            </div>

            <div className="flex items-start space-x-2">
              <input
                type="checkbox"
                name="acceptTerms"
                checked={formData.acceptTerms}
                onChange={handleInputChange}
                className="mt-1 rounded border-gray-300"
                required
              />
              <label className="text-sm text-gray-600">
                I agree to the terms and conditions and certify that all
                provided information is accurate
              </label>
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 p-4 text-red-500">
                {error}
              </div>
            )}

            {success && (
              <div className="rounded-lg bg-green-50 p-4 text-green-500">
                Application submitted successfully! Redirecting...
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-lg bg-[#357AFF] px-6 py-3 text-white transition-colors hover:bg-[#2E69DE] focus:outline-none focus:ring-2 focus:ring-[#357AFF] focus:ring-offset-2 disabled:opacity-50"
            >
              {isSubmitting ? "Submitting..." : "Submit Application"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function CounselorApplicationPage() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <Suspense fallback={<div>Loading...</div>}>
      {isClient ? (
        <UserProvider>
          {(userState) => <MainComponent user={userState.data} userLoading={userState.loading} />}
        </UserProvider>
      ) : (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#357AFF] border-t-transparent"></div>
        </div>
      )}
    </Suspense>
  );
}