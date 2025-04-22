"use client";
import React, { useState, useEffect } from "react";
import { useUser } from "@/utils/useUser";
import { supabase } from "@/utils/supabaseClient";
import {
  GlassContainer,
  GlassCard,
  BackButton,
  ModernButton,
  ModernTextarea,
  ModernHeading,
  ModernAlert,
  ModernInput,
  ModernSelect,
  ModernCheckbox,
  ModernFormGroup,
  ModernLabel,
  ModernSpinner
} from "@/components/ui/ModernUI";
import { motion, AnimatePresence } from "framer-motion";
import toast, { Toaster } from 'react-hot-toast';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      when: "beforeChildren",
      staggerChildren: 0.1,
      duration: 0.4
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: "spring", stiffness: 300, damping: 24 }
  }
};

const buttonVariants = {
  initial: { scale: 1 },
  hover: {
    scale: 1.03,
    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
    transition: { duration: 0.2 }
  },
  tap: { scale: 0.95 }
};

const headingVariants = {
  hidden: { opacity: 0, y: -20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 30,
      delay: 0.1
    }
  }
};

const checkboxVariants = {
  checked: { scale: 1.1 },
  unchecked: { scale: 1 },
  tap: { scale: 0.9 }
};

function MainComponent() {
  const { data: user, loading: userLoading } = useUser();
  const [sessionType, setSessionType] = useState("one_on_one");
  const [scheduledFor, setScheduledFor] = useState("");
  const [dateError, setDateError] = useState("");
  const [notes, setNotes] = useState("");
  const [videoEnabled, setVideoEnabled] = useState(false);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formTitle, setFormTitle] = useState("Book a Counseling Session");
  const [counselors, setCounselors] = useState([]);
  const [selectedCounselor, setSelectedCounselor] = useState("");
  const [loadingCounselors, setLoadingCounselors] = useState(false);

  // Update title based on session type
  useEffect(() => {
    if (sessionType === "one_on_one") {
      setFormTitle("Book Your One-on-One Session");
    } else if (sessionType === "group") {
      setFormTitle("Book Your Group Session");
    } else {
      setFormTitle("Book a Counseling Session");
    }
  }, [sessionType]);

  // Check authentication status
  const [authStatus, setAuthStatus] = useState(null);

  // Function to fetch counselors
  const fetchCounselors = async () => {
    try {
      setLoadingCounselors(true);
      setError(null);

      // Fetch counselors from the database
      const { data: counselorProfiles, error: counselorsError } = await supabase
        .from('user_profiles')
        .select('id, display_name, bio')
        .eq('role', 'counselor');

      if (counselorsError) {
        console.error('Error fetching counselors:', counselorsError);
        throw new Error('Failed to fetch counselors');
      }

      // If no counselors found, create a default one for testing
      if (!counselorProfiles || counselorProfiles.length === 0) {
        // For testing purposes, we'll use a UUID format
        setCounselors([{
          id: '00000000-0000-0000-0000-000000000001',
          display_name: 'Default Counselor',
          bio: 'This is a default counselor for testing purposes.'
        }]);
      } else {
        setCounselors(counselorProfiles);
      }

      // Set the first counselor as selected by default
      if (counselorProfiles && counselorProfiles.length > 0) {
        setSelectedCounselor(counselorProfiles[0].id);
      } else {
        setSelectedCounselor('00000000-0000-0000-0000-000000000001');
      }
    } catch (err) {
      console.error('Error loading counselors:', err);
      setError('Failed to load counselors. Please try again later.');
    } finally {
      setLoadingCounselors(false);
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      if (user) {
        try {
          // First check if we can make a simple authenticated request
          const testResponse = await fetch('/api/auth-test', {
            method: 'GET',
            credentials: 'include'
          });

          if (testResponse.ok) {
            setAuthStatus('authenticated');
          } else {
            // Fallback to checking Supabase session
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
              setAuthStatus('authenticated');
            } else {
              setAuthStatus('token-missing');
            }
          }
        } catch (err) {
          console.error('Auth check error:', err);
          setAuthStatus('error');
        }
      } else {
        setAuthStatus('not-authenticated');
      }
    };

    if (!userLoading) {
      checkAuth();
      if (user) {
        fetchCounselors();
      }
    }
  }, [user, userLoading]);

  // Validate date when it changes
  const validateDate = (dateString) => {
    if (!dateString) {
      setDateError(""); // We'll show the required error instead
      return;
    }

    const selectedDate = new Date(dateString);
    const now = new Date();

    if (isNaN(selectedDate.getTime())) {
      setDateError("Invalid date format");
      return false;
    }

    if (selectedDate < now) {
      setDateError("Please select a future date and time");
      return false;
    }

    setDateError("");
    return true;
  };

  const handleDateChange = (e) => {
    const newDate = e.target.value;
    setScheduledFor(newDate);
    validateDate(newDate);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      setError("Please sign in to book a session");
      toast.error("Please sign in to book a session");
      return;
    }

    // Check authentication status
    if (authStatus !== 'authenticated') {
      setError("Authentication required. Please sign in again.");
      toast.error("Authentication required. Please sign in again.");
      return;
    }

    // Validate counselor selection
    if (!selectedCounselor) {
      setError("Please select a counselor");
      toast.error("Please select a counselor");
      return;
    }

    // Validate date before submitting
    if (!scheduledFor) {
      setError("Please select a date and time for your session");
      toast.error("Please select a date and time for your session");
      return;
    }

    // Validate date is not in the past
    if (!validateDate(scheduledFor)) {
      setError(dateError);
      toast.error(dateError);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    // Show loading toast
    const loadingToast = toast.loading("Booking your session...");

    try {
      // Validate date before sending
      if (!scheduledFor) {
        throw new Error("Please select a date and time for your session");
      }

      const scheduledDate = new Date(scheduledFor);
      if (isNaN(scheduledDate.getTime())) {
        throw new Error("Invalid date format. Please select a valid date and time.");
      }

      // Check if date is in the past
      if (scheduledDate < new Date()) {
        throw new Error("Please select a future date and time for your session");
      }

      // We'll use the built-in cookie-based authentication instead of tokens
      // This should work better with Next.js API routes
      const response = await fetch("/api/counseling/create-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        // Include credentials to send cookies
        credentials: "include",
        body: JSON.stringify({
          counselorId: selectedCounselor,
          patientId: user.id,
          type: sessionType,
          scheduledFor: scheduledDate.toISOString(),
          videoEnabled: videoEnabled,
          notes: notes.trim() || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Get specific error message from the API response
        const errorMessage = data.error || "Failed to book session";
        throw new Error(errorMessage);
      }

      // Dismiss loading toast and show success
      toast.dismiss(loadingToast);
      toast.success("Session booked successfully!");

      setSuccess(true);
      setTimeout(() => {
        window.location.href = "/home";
      }, 2000);
    } catch (err) {
      console.error(err);
      // Dismiss loading toast and show error
      toast.dismiss(loadingToast);

      // Show the specific error message
      const errorMessage = err.message || "Failed to book your session. Please try again.";
      toast.error(errorMessage);
      setError(errorMessage);

      // Add troubleshooting tips for common errors
      if (errorMessage.includes("date") || errorMessage.includes("time")) {
        setError(errorMessage + "\n\nTip: Make sure you've selected a valid future date and time.");
      } else if (errorMessage.includes("counselor")) {
        setError(errorMessage + "\n\nTip: The selected counselor may not be available. Try again later.");
      } else if (errorMessage.includes("invalid input syntax for type uuid")) {
        setError(errorMessage + "\n\nTip: There seems to be an issue with the counselor ID format. Please try selecting a different counselor or refresh the page.");
      } else if (errorMessage.includes("type column") || errorMessage.includes("schema cache")) {
        setError(errorMessage + "\n\nTip: The database schema needs to be updated. Please contact an administrator to fix this issue.");

        // Add admin link if user is an admin
        if (user?.email?.includes("admin") || user?.email === "markgarciabjj@gmail.com") {
          setError(errorMessage + "\n\nTip: As an admin, you can fix this by clicking the button below to add the missing column.");

          // Add a small delay to ensure the error message is displayed before showing the button
          setTimeout(() => {
            const errorDiv = document.querySelector('.error-message');
            if (errorDiv) {
              const fixButton = document.createElement('a');
              fixButton.href = '/admin/fix-db-schema';
              fixButton.className = 'mt-3 inline-block bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200';
              fixButton.innerHTML = '🛠️ Fix Database Schema';
              errorDiv.appendChild(fixButton);
            }
          }, 500);
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (userLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-[#f1f8ff] to-purple-50 p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-[#f1f8ff] to-purple-50 p-4">
        <div className="mx-auto max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="rounded-2xl shadow-2xl bg-white p-8 border border-gray-100 text-center"
          >
            <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>

            <h1 className="text-2xl font-bold text-gray-800 mb-2">Sign In Required</h1>

            <div className="h-1 w-16 bg-red-200 mx-auto mb-4"></div>

            <p className="mb-6 text-gray-600">
              Please sign in to book a counseling session.
            </p>

            <motion.button
              onClick={() => window.location.href = "/account/signin"}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-full shadow-lg transition-all duration-300"
              whileHover={{ scale: 1.03, boxShadow: "0 10px 15px -3px rgba(59, 130, 246, 0.3), 0 4px 6px -2px rgba(59, 130, 246, 0.2)" }}
              whileTap={{ scale: 0.98 }}
            >
              Sign In
            </motion.button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-[#f1f8ff] to-purple-50 p-4">
      <div className="mx-auto max-w-4xl">
        <div className="flex justify-between items-center mb-4">
          <BackButton />
          <motion.button
            onClick={() => window.location.reload()}
            className="flex items-center text-sm bg-white/80 hover:bg-white py-2 px-4 rounded-lg border border-blue-100 text-blue-700 shadow-sm transition-colors duration-200"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh Page
          </motion.button>
        </div>

        <Toaster position="top-center" toastOptions={{
          duration: 3000,
          style: {
            background: '#fff',
            color: '#333',
            borderRadius: '10px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }} />

        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          <motion.div
            className="rounded-2xl shadow-2xl bg-white p-8 border border-gray-100 hover:shadow-3xl transition-shadow duration-300"
            whileHover={{ boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.1)" }}
          >
          <motion.div variants={headingVariants}>
            <h1 className="text-2xl md:text-3xl font-bold text-center text-gray-800 mb-2">
              {formTitle}
            </h1>

            <div className="flex justify-center mb-6">
              <motion.div
                className="h-1 w-20 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full"
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 80, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              />
            </div>

            <motion.p
              className="text-sm text-gray-500 mb-6 text-center italic"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              We're here for you — choose a session type and let's find time to talk.
            </motion.p>

            {user && (
              <div className={`flex items-center justify-between mb-4 py-2 px-4 rounded-xl text-sm border ${authStatus === 'authenticated' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'}`}>
                <div className="flex items-center">
                  {authStatus === 'authenticated' ? (
                    <>
                      <svg className="h-4 w-4 mr-2 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Signed in as {user.email}</span>
                    </>
                  ) : authStatus === 'token-missing' ? (
                    <>
                      <svg className="h-4 w-4 mr-2 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <span>Authentication token missing</span>
                    </>
                  ) : (
                    <>
                      <svg className="h-4 w-4 mr-2 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <span>Checking authentication status...</span>
                    </>
                  )}
                </div>
                {authStatus !== 'authenticated' && (
                  <motion.button
                    onClick={async () => {
                      const checkingToast = toast.loading("Checking authentication...");
                      try {
                        // Try to refresh the session
                        const { data, error } = await supabase.auth.refreshSession();
                        if (error) throw error;

                        if (data.session) {
                          setAuthStatus('authenticated');
                          toast.dismiss(checkingToast);
                          toast.success("Authentication refreshed!");
                        } else {
                          throw new Error("No session found");
                        }
                      } catch (err) {
                        console.error("Auth refresh error:", err);
                        toast.dismiss(checkingToast);
                        toast.error("Could not refresh authentication");
                      }
                    }}
                    className="text-xs bg-white/80 hover:bg-white py-1 px-2 rounded-md border border-yellow-200 text-yellow-700 transition-colors duration-200"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <span className="flex items-center">
                      <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Refresh
                    </span>
                  </motion.button>
                )}
              </div>
            )}
          </motion.div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <motion.div variants={itemVariants}>
              <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-100 shadow-sm">
                <label htmlFor="session-type" className="flex items-center mb-2 text-sm font-medium text-gray-700">
                  <span className="bg-indigo-100 p-2 rounded-full text-indigo-600 mr-3 shadow-sm">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </span>
                  <span>Session Type</span>
                </label>
                <div className="relative">
                  <select
                    id="session-type"
                    value={sessionType}
                    onChange={(e) => setSessionType(e.target.value)}
                    className="w-full rounded-lg border border-blue-200 p-3 pl-10 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-300 transition-all duration-200 bg-white shadow-sm"
                  >
                    <option value="one_on_one">One-on-One Session</option>
                    <option value="group">Group Session</option>
                  </select>
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-500 pointer-events-none">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div variants={itemVariants}>
              <div className="mb-6 bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-xl border border-green-100 shadow-sm">
                <label htmlFor="counselor" className="flex items-center mb-2 text-sm font-medium text-gray-700">
                  <span className="bg-green-100 p-2 rounded-full text-green-600 mr-3 shadow-sm">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </span>
                  <span>Select Counselor</span>
                </label>
                <div className="relative">
                  {loadingCounselors ? (
                    <div className="w-full rounded-lg border border-green-200 p-3 pl-10 bg-white shadow-sm flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-500 mr-2"></div>
                      <span className="text-gray-500">Loading counselors...</span>
                    </div>
                  ) : (
                    <select
                      id="counselor"
                      value={selectedCounselor}
                      onChange={(e) => setSelectedCounselor(e.target.value)}
                      className="w-full rounded-lg border border-green-200 p-3 pl-10 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-300 transition-all duration-200 bg-white shadow-sm"
                      required
                    >
                      <option value="" disabled>Select a counselor</option>
                      {counselors.map((counselor) => (
                        <option key={counselor.id} value={counselor.id}>
                          {counselor.display_name}
                        </option>
                      ))}
                    </select>
                  )}
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-500 pointer-events-none">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                </div>
                {counselors.length > 0 && selectedCounselor && (
                  <div className="mt-2 ml-12">
                    <p className="text-xs text-gray-600 flex items-center">
                      <span className="text-green-500 mr-1">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </span>
                      {counselors.find(c => c.id === selectedCounselor)?.bio || 'Selected counselor'}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>

            <motion.div variants={itemVariants}>
              <div className="mb-6 bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-xl border border-purple-100 shadow-sm">
                <label htmlFor="scheduled-for" className="flex items-center mb-2 text-sm font-medium text-gray-700">
                  <span className="bg-purple-100 p-2 rounded-full text-purple-600 mr-3 shadow-sm">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </span>
                  <span>Date and Time</span>
                </label>
                <div className="relative">
                  <input
                    id="scheduled-for"
                    type="datetime-local"
                    value={scheduledFor}
                    onChange={handleDateChange}
                    required
                    className={`w-full rounded-lg border p-3 pl-10 focus:outline-none focus:ring-2 transition-all duration-200 bg-white shadow-sm ${(!scheduledFor || dateError) ? 'border-red-300 focus:border-red-500 focus:ring-red-300' : 'border-purple-200 focus:border-purple-500 focus:ring-purple-300'}`}
                    onInvalid={(e) => e.target.setCustomValidity('Please select a date and time for your session')}
                    onInput={(e) => e.target.setCustomValidity('')}
                    min={new Date().toISOString().slice(0, 16)} // Set minimum date to now
                  />
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-500 pointer-events-none">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
                <AnimatePresence>
                  {!scheduledFor ? (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="text-xs text-red-500 mt-2 ml-12 flex items-center"
                    >
                      <span className="text-red-500 mr-1">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      </span>
                      Please select a date and time for your session
                    </motion.p>
                  ) : dateError ? (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="text-xs text-red-500 mt-2 ml-12 flex items-center"
                    >
                      <span className="text-red-500 mr-1">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      </span>
                      {dateError}
                    </motion.p>
                  ) : (
                    <p className="text-xs text-gray-600 mt-2 ml-12 flex items-center">
                      <span className="text-purple-500 mr-1">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </span>
                      Select a date and time that works best for you
                    </p>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>

            <motion.div variants={itemVariants}>
              <div className="mb-6 bg-gradient-to-r from-teal-50 to-blue-50 p-4 rounded-xl border border-teal-100 shadow-sm">
                <label htmlFor="notes" className="flex items-center mb-2 text-sm font-medium text-gray-700">
                  <span className="bg-teal-100 p-2 rounded-full text-teal-600 mr-3 shadow-sm">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                    </svg>
                  </span>
                  <span>Notes (Optional)</span>
                </label>
                <div className="relative">
                  <textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Share any specific concerns or topics you'd like to discuss..."
                    rows={4}
                    className="w-full rounded-lg border border-teal-200 p-3 pl-10 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-300 transition-all duration-200 bg-white shadow-sm"
                  />
                  <div className="absolute left-3 top-3 text-teal-500 pointer-events-none">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </div>
                </div>
                <div className="flex justify-end mt-1">
                  <p className="text-xs text-gray-500 italic">{notes.length > 0 ? `${notes.length} characters` : 'Share what\'s on your mind'}</p>
                </div>
              </div>
            </motion.div>

            <motion.div variants={itemVariants}>
              <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 p-5 rounded-xl border border-blue-100 shadow-sm transition-all duration-300 hover:shadow-md">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <span className="bg-blue-100 p-2 rounded-full text-blue-600 mr-3 shadow-sm">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </span>
                    <label htmlFor="video-enabled" className="text-sm font-medium text-gray-700 cursor-pointer">
                      Enable video call for this session
                    </label>
                  </div>

                  <motion.div
                    whileTap="tap"
                    animate={videoEnabled ? "checked" : "unchecked"}
                    variants={checkboxVariants}
                  >
                    <div className="relative">
                      <div
                        className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 ${videoEnabled ? 'bg-blue-600' : 'bg-gray-300'}`}
                        onClick={() => setVideoEnabled(!videoEnabled)}
                      >
                        <div
                          className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${videoEnabled ? 'translate-x-6' : ''}`}
                        />
                      </div>
                      <input
                        type="checkbox"
                        id="video-enabled"
                        checked={videoEnabled}
                        onChange={(e) => setVideoEnabled(e.target.checked)}
                        className="sr-only"
                      />
                    </div>
                  </motion.div>
                </div>

                <AnimatePresence>
                  {videoEnabled && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-4 ml-12 text-sm text-gray-600 bg-white/80 p-4 rounded-md border border-blue-100">
                        <div className="flex">
                          <span className="text-blue-500 mr-3 mt-1">
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </span>
                          <div>
                            <p className="font-medium text-blue-800 mb-1">Video Call Enabled</p>
                            <p>A secure video room will be created for your session. You'll receive a link to join before the scheduled time.</p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mb-6 bg-red-50 text-red-700 p-4 rounded-xl border border-red-200 shadow-sm"
                >
                  <div className="flex">
                    <svg className="h-5 w-5 mr-3 flex-shrink-0 mt-0.5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="error-message">
                      {error.split('\n').map((line, index) => (
                        <div key={index} className={index === 0 ? "font-medium" : "text-sm mt-1 text-red-600"}>
                          {line}
                        </div>
                      ))}

                      {error.includes('Authentication required') && (
                        <div className="mt-3 text-sm bg-white/50 p-3 rounded border border-red-100">
                          <p className="font-medium mb-1">Troubleshooting:</p>
                          <ul className="list-disc list-inside space-y-1">
                            <li>Try refreshing the page</li>
                            <li>Sign out and sign back in</li>
                            <li>Clear your browser cookies and try again</li>
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {success && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mb-6 bg-green-50 text-green-700 p-4 rounded-xl border border-green-200 shadow-sm"
                >
                  <div className="flex items-center">
                    <svg className="h-5 w-5 mr-3 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <span className="font-medium">Success!</span> Session booked successfully! Redirecting...
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div variants={itemVariants}>
              {authStatus === 'authenticated' ? (
                <motion.button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full relative overflow-hidden rounded-full py-3 px-6 font-medium text-white shadow-lg transition-all duration-300 ${isSubmitting ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'}`}
                  whileHover={isSubmitting ? {} : { scale: 1.02, boxShadow: "0 10px 15px -3px rgba(59, 130, 246, 0.3), 0 4px 6px -2px rgba(59, 130, 246, 0.2)" }}
                  whileTap={isSubmitting ? {} : { scale: 0.98 }}
                >
                  <div className="relative z-10 flex items-center justify-center">
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Booking your session...</span>
                      </>
                    ) : (
                      <>
                        <span className="mr-2">💬</span>
                        <span>Book Session</span>
                      </>
                    )}
                  </div>
                  {!isSubmitting && (
                    <div className="absolute inset-0 overflow-hidden">
                      <span className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-blue-400 to-indigo-500 opacity-0 hover:opacity-20 transition-opacity duration-300"></span>
                      <span className="absolute bottom-0 left-0 w-full h-1 bg-white/30 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></span>
                    </div>
                  )}
                </motion.button>
              ) : authStatus === 'token-missing' ? (
                <div className="space-y-3">
                  <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200 text-sm text-yellow-700 mb-2">
                    <p className="font-medium">Authentication Required</p>
                    <p className="mt-1">Your session may have expired. Please sign in again to continue.</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <motion.button
                      type="button"
                      onClick={async () => {
                        try {
                          await supabase.auth.signOut();
                          toast.success("Signed out successfully");
                          setTimeout(() => {
                            window.location.href = "/account/signin";
                          }, 1000);
                        } catch (err) {
                          console.error("Sign out error:", err);
                          window.location.href = "/account/signin";
                        }
                      }}
                      className="relative overflow-hidden rounded-full py-3 px-6 font-medium text-white shadow-lg transition-all duration-300 bg-red-500 hover:bg-red-600"
                      whileHover={{ scale: 1.02, boxShadow: "0 10px 15px -3px rgba(239, 68, 68, 0.3), 0 4px 6px -2px rgba(239, 68, 68, 0.2)" }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <span className="mr-2">🚪</span>
                      <span>Sign Out First</span>
                    </motion.button>
                    <motion.button
                      type="button"
                      onClick={() => window.location.href = "/account/signin"}
                      className="relative overflow-hidden rounded-full py-3 px-6 font-medium text-white shadow-lg transition-all duration-300 bg-blue-600 hover:bg-blue-700"
                      whileHover={{ scale: 1.02, boxShadow: "0 10px 15px -3px rgba(59, 130, 246, 0.3), 0 4px 6px -2px rgba(59, 130, 246, 0.2)" }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <span className="mr-2">🔒</span>
                      <span>Sign In Again</span>
                    </motion.button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200 text-sm text-yellow-700 mb-2">
                    <p className="font-medium">Checking Authentication Status</p>
                    <p className="mt-1">Please wait while we verify your session...</p>
                  </div>
                  <motion.button
                    type="button"
                    disabled
                    className="w-full relative overflow-hidden rounded-full py-3 px-6 font-medium text-white shadow-lg transition-all duration-300 bg-blue-400"
                  >
                    <div className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Checking...</span>
                    </div>
                  </motion.button>
                </div>
              )}
            </motion.div>
          </form>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

export default MainComponent;