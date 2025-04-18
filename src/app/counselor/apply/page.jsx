"use client";
import React, { useState, useEffect } from "react";
import { useUser } from "@/utils/useUser";
import { supabase } from "@/utils/supabaseClient";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function CounselorApplicationPage() {
  const router = useRouter();
  const { data: user, loading: userLoading } = useUser();
  const [formData, setFormData] = useState({
    credentials: "",
    yearsExperience: "",
    specializations: "",
    summary: "",
    phone: "",
    licenseUrl: ""
  });
  // State for form errors
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isCounselor, setIsCounselor] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);

  useEffect(() => {
    if (!userLoading && !user) {
      router.push("/account/signin?redirect=/counselor/apply");
    }
  }, [user, userLoading, router]);

  useEffect(() => {
    if (user) {
      checkStatus();
      ensureStorageBucket();
    }
  }, [user]);

  const ensureStorageBucket = async () => {
    try {
      // Check if the bucket exists
      const { data: buckets, error: listError } = await supabase.storage.listBuckets();

      if (listError) {
        console.error('Error listing buckets:', listError);
        return;
      }

      console.log('Available buckets:', buckets);
      const bucketExists = buckets.some(bucket => bucket.name === 'counselor-licenses');

      if (!bucketExists) {
        console.log('Creating counselor-licenses bucket');
        // Create the bucket
        const { error } = await supabase.storage.createBucket('counselor-licenses', {
          public: true,
          fileSizeLimit: 5 * 1024 * 1024, // 5MB
          allowedMimeTypes: ['application/pdf', 'image/jpeg', 'image/png']
        });

        if (error) {
          console.error('Error creating bucket:', error);
        } else {
          console.log('Bucket created successfully');

          // Set public bucket policy
          const { error: policyError } = await supabase.storage.from('counselor-licenses').createSignedUrl('test.txt', 60);
          if (policyError) {
            console.error('Error setting bucket policy:', policyError);
          }
        }
      } else {
        console.log('Bucket counselor-licenses already exists');

        // Check if we can access the bucket
        const { data: files, error: listFilesError } = await supabase.storage.from('counselor-licenses').list();
        if (listFilesError) {
          console.error('Error listing files in bucket:', listFilesError);
        } else {
          console.log('Files in bucket:', files);
        }
      }
    } catch (err) {
      console.error('Error ensuring storage bucket:', err);
    }
  };

  const checkStatus = async () => {
    try {
      // Check if the user is already a counselor
      const { data: profile, error: profileError } = await supabase
        .from("user_profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (!profileError && profile?.role === "counselor") {
        setIsCounselor(true);
        return;
      }

      // Check if the user has already applied
      const { data: application, error: applicationError } = await supabase
        .from("counselor_applications")
        .select("status")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (!applicationError && application) {
        setHasApplied(true);
      }
    } catch (err) {
      console.error("Error checking counselor status:", err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // No longer using file upload functionality

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      // Validate form data
      if (!formData.credentials || !formData.yearsExperience || !formData.specializations || !formData.summary) {
        throw new Error("Please fill in all required fields");
      }

      // Get the current auth token
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        console.error('No authentication token available');
        throw new Error('Authentication required. Please sign in again.');
      }

      console.log('Authentication token available:', !!token);

      // Just use the URL if provided
      const licenseUrl = formData.licenseUrl || '';

      // Submit the application with the license URL
      const applicationData = {
        ...formData,
        licenseUrl
      };

      console.log('Submitting application data:', applicationData);

      console.log('Submitting application with token');
      const response = await fetch("/api/counselor/apply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(applicationData),
      });

      console.log('Response status:', response.status);
      const responseData = await response.json();
      console.log('Response data:', responseData);

      if (!response.ok) {
        throw new Error(responseData.error || "Failed to submit application");
      }

      setSuccess(true);
      setHasApplied(true);
    } catch (err) {
      console.error("Error submitting application:", err);
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
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#357AFF] border-t-transparent"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-xl">
          <h1 className="mb-4 text-2xl font-bold text-gray-800">Sign In Required</h1>
          <p className="mb-6 text-gray-600">
            Please sign in to apply as a counselor.
          </p>
          <Link
            href={`/account/signin?redirect=${encodeURIComponent('/counselor/apply')}`}
            className="inline-block rounded-lg bg-[#357AFF] px-6 py-3 text-white hover:bg-[#2E69DE]"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  if (isCounselor) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-xl">
          <h1 className="mb-4 text-2xl font-bold text-gray-800">You're Already a Counselor</h1>
          <p className="mb-6 text-gray-600">
            You already have counselor access on our platform.
          </p>
          <Link
            href="/counselor/sessions"
            className="inline-block rounded-lg bg-[#357AFF] px-6 py-3 text-white hover:bg-[#2E69DE]"
          >
            Go to Your Sessions
          </Link>
        </div>
      </div>
    );
  }

  if (hasApplied || success) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-xl">
          <h1 className="mb-4 text-2xl font-bold text-gray-800">Application Submitted</h1>
          <p className="mb-6 text-gray-600">
            Thank you for applying to be a counselor on our platform. We'll review your application and get back to you soon.
          </p>
          <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3 justify-center">
            <Link
              href="/"
              className="inline-block rounded-lg bg-[#357AFF] px-6 py-3 text-white hover:bg-[#2E69DE]"
            >
              Return to Home
            </Link>
            <button
              onClick={checkStatus}
              className="inline-block rounded-lg bg-gray-200 px-6 py-3 text-gray-700 hover:bg-gray-300"
            >
              Refresh Status
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Add a key to force re-render
  const formVersion = "v2";

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
      <div className="mx-auto max-w-4xl">
        <Link
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
        </Link>

        <div className="rounded-2xl bg-white p-6 shadow-xl md:p-8">
          <h1 className="mb-6 text-center text-3xl font-bold text-gray-800">
            Apply to Become a Counselor
          </h1>

          <div className="mb-6 rounded-lg bg-blue-50 p-4 text-blue-700">
            <p>
              Thank you for your interest in joining our platform as a counselor. Please fill out the form below to apply.
            </p>
          </div>

          <form key={formVersion} onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Professional Credentials/Licenses *
              </label>
              <input
                type="text"
                name="credentials"
                value={formData.credentials}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-200 p-3 focus:border-[#357AFF] focus:outline-none focus:ring-1 focus:ring-[#357AFF]"
                placeholder="e.g., Licensed Clinical Social Worker (LCSW), Psychologist (Ph.D.)"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Years of Experience *
              </label>
              <input
                type="number"
                name="yearsExperience"
                value={formData.yearsExperience}
                onChange={handleChange}
                min="0"
                className="w-full rounded-lg border border-gray-200 p-3 focus:border-[#357AFF] focus:outline-none focus:ring-1 focus:ring-[#357AFF]"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Specializations/Areas of Focus *
              </label>
              <input
                type="text"
                name="specializations"
                value={formData.specializations}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-200 p-3 focus:border-[#357AFF] focus:outline-none focus:ring-1 focus:ring-[#357AFF]"
                placeholder="e.g., Anxiety, Depression, Trauma, LGBTQ+ issues"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Professional Summary *
              </label>
              <textarea
                name="summary"
                value={formData.summary}
                onChange={handleChange}
                rows="4"
                className="w-full rounded-lg border border-gray-200 p-3 focus:border-[#357AFF] focus:outline-none focus:ring-1 focus:ring-[#357AFF]"
                placeholder="Please provide a brief summary of your professional background and approach to counseling."
                required
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Contact Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
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
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-200 p-3 focus:border-[#357AFF] focus:outline-none focus:ring-1 focus:ring-[#357AFF]"
                placeholder="Link to verify your credentials (e.g., LinkedIn profile)"
              />
              <p className="text-xs text-gray-500">Provide a URL to your credentials or license verification (LinkedIn profile, professional directory listing, etc.)</p>
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 p-4 text-red-500">
                <p className="font-medium">{error}</p>
                {error.includes('Authentication') && (
                  <div className="mt-2">
                    <Link
                      href={`/account/signin?redirect=${encodeURIComponent('/counselor/apply')}`}
                      className="inline-block rounded-lg bg-red-100 px-4 py-2 text-red-700 hover:bg-red-200"
                    >
                      Sign In Again
                    </Link>
                  </div>
                )}
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
