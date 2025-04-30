"use client";
import React, { useState, useEffect } from "react";
import { useUser } from "@/utils/useUser";
import { supabase } from "@/utils/supabaseClient";
import Link from "next/link";

export default function CreateTestSessionPage() {
  const { data: user, loading: userLoading } = useUser();
  const [counselors, setCounselors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [selectedCounselor, setSelectedCounselor] = useState("");
  const [selectedPatient, setSelectedPatient] = useState("");
  const [sessionDate, setSessionDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    if (user) {
      loadUsers();
    }
  }, [user]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get counselors
      const { data: counselorData, error: counselorError } = await supabase
        .from('user_profiles')
        .select('id, display_name')
        .eq('role', 'counselor');

      if (counselorError) throw counselorError;
      setCounselors(counselorData || []);

      // Get patients (regular users)
      const { data: patientData, error: patientError } = await supabase
        .from('user_profiles')
        .select('id, display_name')
        .eq('role', 'user');

      if (patientError) throw patientError;
      setPatients(patientData || []);

      // Set default date to tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(10, 0, 0, 0);
      setSessionDate(tomorrow.toISOString().slice(0, 16));

    } catch (err) {
      console.error("Error loading users:", err);
      setError("Failed to load users: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const createTestSession = async (e) => {
    e.preventDefault();
    
    if (!selectedCounselor || !selectedPatient || !sessionDate) {
      setError("Please fill in all required fields");
      return;
    }

    try {
      setCreating(true);
      setError(null);
      setSuccess(null);

      const { data, error } = await supabase
        .from('counseling_sessions')
        .insert({
          counselor_id: selectedCounselor,
          patient_id: selectedPatient,
          session_date: new Date(sessionDate).toISOString(),
          status: 'scheduled',
          notes: 'This is a test counseling session'
        })
        .select();

      if (error) throw error;

      setSuccess("Test session created successfully!");
      console.log("Created session:", data);
      
      // Reset form
      setSelectedCounselor("");
      setSelectedPatient("");
      
      // Set date to tomorrow again
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(10, 0, 0, 0);
      setSessionDate(tomorrow.toISOString().slice(0, 16));
      
    } catch (err) {
      console.error("Error creating test session:", err);
      setError("Failed to create test session: " + err.message);
    } finally {
      setCreating(false);
    }
  };

  if (userLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-xl p-8 max-w-md w-full">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Authentication Required</h1>
          <p className="text-gray-600 mb-6">Please sign in to access this page.</p>
          <Link href="/account/signin" className="block w-full bg-indigo-600 text-white text-center py-2 px-4 rounded-lg hover:bg-indigo-700">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-gray-600 shadow-md hover:bg-gray-50"
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
        </div>

        <div className="bg-white rounded-xl shadow-xl p-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">Create Test Counseling Session</h1>
          
          {error && (
            <div className="mb-6 bg-red-50 p-4 rounded-lg text-red-600">
              {error}
            </div>
          )}
          
          {success && (
            <div className="mb-6 bg-green-50 p-4 rounded-lg text-green-600">
              {success}
            </div>
          )}

          <form onSubmit={createTestSession}>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="counselor">
                Counselor
              </label>
              <select
                id="counselor"
                value={selectedCounselor}
                onChange={(e) => setSelectedCounselor(e.target.value)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                disabled={loading || creating}
              >
                <option value="">Select a counselor</option>
                {counselors.map((counselor) => (
                  <option key={counselor.id} value={counselor.id}>
                    {counselor.display_name || "Unnamed Counselor"}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="patient">
                Patient
              </label>
              <select
                id="patient"
                value={selectedPatient}
                onChange={(e) => setSelectedPatient(e.target.value)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                disabled={loading || creating}
              >
                <option value="">Select a patient</option>
                {patients.map((patient) => (
                  <option key={patient.id} value={patient.id}>
                    {patient.display_name || "Unnamed Patient"}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="sessionDate">
                Session Date and Time
              </label>
              <input
                id="sessionDate"
                type="datetime-local"
                value={sessionDate}
                onChange={(e) => setSessionDate(e.target.value)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                disabled={loading || creating}
              />
            </div>

            <div className="flex items-center justify-between">
              <button
                type="submit"
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                disabled={loading || creating}
              >
                {creating ? "Creating..." : "Create Test Session"}
              </button>
              
              <Link
                href="/counselor/client-checkins"
                className="inline-block align-baseline font-bold text-sm text-blue-500 hover:text-blue-800"
              >
                Go to Client Check-ins
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
