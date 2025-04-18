"use client";
import React, { useEffect, useState } from "react";
import { supabase } from "@/utils/supabaseClient";
import { useUser } from "@/utils/useUser";

export default function AuthTest() {
  const { data: user, loading } = useUser();
  const [sessionData, setSessionData] = useState(null);
  const [error, setError] = useState(null);
  const [testResult, setTestResult] = useState(null);

  useEffect(() => {
    async function checkSession() {
      try {
        const { data, error } = await supabase.auth.getSession();
        setSessionData(data);
        if (error) {
          setError(error.message);
        }
      } catch (err) {
        setError(err.message);
      }
    }
    
    checkSession();
  }, []);

  const handleTestAuth = async () => {
    try {
      const response = await fetch("/api/auth-test", {
        method: "POST",
      });
      const result = await response.json();
      setTestResult(result);
    } catch (err) {
      setTestResult({ error: err.message });
    }
  };

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      setError(error.message);
    } else {
      window.location.href = "/account/signin";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg overflow-hidden p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Authentication Test</h1>
          
          {error && (
            <div className="p-4 mb-4 bg-red-50 border-l-4 border-red-400">
              <p className="text-red-700">{error}</p>
            </div>
          )}
          
          <div className="mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-2">User from useUser hook:</h2>
            {loading ? (
              <p>Loading...</p>
            ) : user ? (
              <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-40">
                {JSON.stringify(user, null, 2)}
              </pre>
            ) : (
              <p className="text-red-600">No user found</p>
            )}
          </div>
          
          <div className="mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-2">Session from direct call:</h2>
            {sessionData ? (
              <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-40">
                {JSON.stringify(sessionData, null, 2)}
              </pre>
            ) : (
              <p>No session data</p>
            )}
          </div>
          
          <div className="mb-6">
            <button
              onClick={handleTestAuth}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Test Auth API
            </button>
            
            {testResult && (
              <div className="mt-4">
                <h3 className="text-md font-medium text-gray-900 mb-2">API Test Result:</h3>
                <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-40">
                  {JSON.stringify(testResult, null, 2)}
                </pre>
              </div>
            )}
          </div>
          
          <div>
            <button
              onClick={handleSignOut}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
