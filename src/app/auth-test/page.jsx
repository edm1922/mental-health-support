"use client";
import React, { useEffect, useState } from "react";
import { supabase } from "@/utils/supabaseClient";
import { useUser } from "@/utils/useUser";
import Navbar from '@/components/ui/Navbar';
import { Button } from '@/components/ui/Button';

export default function AuthTest() {
  const { data: user, loading } = useUser();
  const [sessionData, setSessionData] = useState(null);
  const [error, setError] = useState(null);
  const [testResult, setTestResult] = useState(null);
  const [sessionCheckResult, setSessionCheckResult] = useState(null);
  const [logs, setLogs] = useState([]);

  const addLog = (message) => {
    setLogs(prev => [...prev, `${new Date().toISOString().split('T')[1].split('.')[0]} - ${message}`]);
    console.log(message);
  };

  useEffect(() => {
    async function checkSession() {
      try {
        addLog('Checking authentication session...');
        const { data, error } = await supabase.auth.getSession();
        setSessionData(data);

        if (error) {
          addLog(`Error getting session: ${error.message}`);
          setError(error.message);
        } else if (data.session) {
          addLog(`Session found for user: ${data.session.user.id}`);
        } else {
          addLog('No active session found');
        }

        // Also check the session-check API
        try {
          addLog('Calling session-check API...');
          const response = await fetch('/api/auth/session-check', {
            method: 'GET',
            credentials: 'include'
          });

          const result = await response.json();
          setSessionCheckResult(result);
          addLog(`API session check result: ${result.authenticated ? 'Authenticated' : 'Not authenticated'}`);
        } catch (apiErr) {
          addLog(`Error calling session-check API: ${apiErr.message}`);
          console.error('Error calling session-check API:', apiErr);
        }
      } catch (err) {
        addLog(`Unexpected error: ${err.message}`);
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
    try {
      addLog('Signing out...');
      const { error } = await supabase.auth.signOut();

      if (error) {
        addLog(`Error signing out: ${error.message}`);
        setError(error.message);
      } else {
        addLog('Sign out successful');

        // Clear localStorage items related to auth
        localStorage.removeItem('signin_redirect_timestamp');
        localStorage.removeItem('auth_redirect_timestamp');
        localStorage.removeItem('auth_timestamp');
        localStorage.removeItem('justSignedIn');

        addLog('Cleared auth-related localStorage items');
        window.location.href = "/account/signin";
      }
    } catch (err) {
      addLog(`Unexpected error during sign out: ${err.message}`);
      setError(err.message);
    }
  };

  const clearLocalStorage = () => {
    try {
      addLog('Clearing auth-related localStorage items...');

      localStorage.removeItem('signin_redirect_timestamp');
      localStorage.removeItem('auth_redirect_timestamp');
      localStorage.removeItem('auth_timestamp');
      localStorage.removeItem('justSignedIn');

      addLog('LocalStorage items cleared');
    } catch (err) {
      addLog(`Error clearing localStorage: ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Authentication Test Page</h1>

        {error && (
          <div className="p-4 bg-red-50 rounded-lg mb-6">
            <h2 className="font-bold text-red-700">Error</h2>
            <p>{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-lg font-medium text-gray-900 mb-2">User from useUser hook:</h2>
            {loading ? (
              <p>Loading...</p>
            ) : user ? (
              <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-40 text-xs">
                {JSON.stringify(user, null, 2)}
              </pre>
            ) : (
              <p className="text-red-600">No user found</p>
            )}
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-lg font-medium text-gray-900 mb-2">Session from direct call:</h2>
            {sessionData ? (
              <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-40 text-xs">
                {JSON.stringify(sessionData, null, 2)}
              </pre>
            ) : (
              <p>No session data</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Debug Tools</h2>

            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={() => window.location.href = '/home'}
                  variant="outline"
                  size="sm"
                >
                  Go to Home
                </Button>

                <Button
                  onClick={() => window.location.href = '/counselor/dashboard'}
                  variant="outline"
                  size="sm"
                >
                  Go to Counselor Dashboard
                </Button>

                <Button
                  onClick={() => window.location.href = '/account/signin?bypass_redirect=true'}
                  variant="outline"
                  size="sm"
                >
                  Sign In (Bypass Redirect)
                </Button>

                <Button
                  onClick={clearLocalStorage}
                  variant="outline"
                  size="sm"
                >
                  Clear Auth LocalStorage
                </Button>

                <Button
                  onClick={() => window.location.reload()}
                  variant="outline"
                  size="sm"
                >
                  Reload Page
                </Button>

                <Button
                  onClick={handleTestAuth}
                  variant="primary"
                  size="sm"
                >
                  Test Auth API
                </Button>

                <Button
                  onClick={handleSignOut}
                  variant="destructive"
                  size="sm"
                >
                  Sign Out
                </Button>
              </div>

              {testResult && (
                <div className="mt-4">
                  <h3 className="text-md font-medium text-gray-900 mb-2">API Test Result:</h3>
                  <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-40 text-xs">
                    {JSON.stringify(testResult, null, 2)}
                  </pre>
                </div>
              )}

              <div className="mt-4">
                <h2 className="text-lg font-medium text-gray-900 mb-2">Session Check API Result:</h2>
                {sessionCheckResult ? (
                  <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-40 text-xs">
                    {JSON.stringify(sessionCheckResult, null, 2)}
                  </pre>
                ) : (
                  <p>No session check result</p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Activity Log</h2>
            <div className="bg-gray-50 p-3 rounded-lg h-96 overflow-y-auto font-mono text-xs">
              {logs.map((log, index) => (
                <div key={index} className="pb-1">
                  {log}
                </div>
              ))}
              {logs.length === 0 && (
                <div className="text-gray-400">No activity logged yet</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
