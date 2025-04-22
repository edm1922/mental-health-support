'use client';

import React, { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Link from 'next/link';

export default function AuthFixPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [message, setMessage] = useState('');
  const [debugInfo, setDebugInfo] = useState(null);

  const supabase = createClientComponentClient();

  useEffect(() => {
    // Check current auth status
    async function checkAuth() {
      try {
        setLoading(true);

        // Get current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('Session error:', sessionError);
          setStatus('error');
          setMessage('Error checking session: ' + sessionError.message);
          return;
        }

        // Get debug info from API
        const response = await fetch('/api/auth/debug-auth');
        const debugData = await response.json();
        setDebugInfo(debugData);

        if (session) {
          setStatus('authenticated');
          setMessage(`Authenticated as ${session.user.email}`);
        } else {
          setStatus('unauthenticated');
          setMessage('Not authenticated');
        }
      } catch (error) {
        console.error('Error checking auth:', error);
        setStatus('error');
        setMessage('Error: ' + error.message);
      } finally {
        setLoading(false);
      }
    }

    checkAuth();
  }, []);

  const handleSignOut = async () => {
    try {
      setLoading(true);
      setStatus('loading');
      setMessage('Signing out...');

      // Sign out using Supabase client
      const { error } = await supabase.auth.signOut();

      if (error) {
        throw error;
      }

      // Also call our API to clear cookies
      const response = await fetch('/api/auth/fix-auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'sign-out' })
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to sign out');
      }

      setStatus('success');
      setMessage('Signed out successfully');

      // Refresh the page after a short delay
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error('Error signing out:', error);
      setStatus('error');
      setMessage('Error signing out: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      setStatus('loading');
      setMessage('Signing in...');

      // Sign in using Supabase client
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        throw error;
      }

      setStatus('success');
      setMessage(`Signed in successfully as ${data.user.email}`);

      // Refresh the page after a short delay
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error('Error signing in:', error);
      setStatus('error');
      setMessage('Error signing in: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshSession = async () => {
    try {
      setLoading(true);
      setStatus('loading');
      setMessage('Refreshing session...');

      // Refresh session using Supabase client
      const { data, error } = await supabase.auth.refreshSession();

      if (error) {
        throw error;
      }

      setStatus('success');
      setMessage('Session refreshed successfully');

      // Refresh the page after a short delay
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error('Error refreshing session:', error);
      setStatus('error');
      setMessage('Error refreshing session: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-xl p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Authentication Fix</h1>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">{message || 'Loading...'}</p>
          </div>
        ) : (
          <>
            <div className={`mb-6 p-4 rounded-lg ${
              status === 'error' ? 'bg-red-50 text-red-700' :
              status === 'success' ? 'bg-green-50 text-green-700' :
              status === 'authenticated' ? 'bg-green-50 text-green-700' :
              status === 'unauthenticated' ? 'bg-yellow-50 text-yellow-700' :
              'bg-gray-50 text-gray-700'
            }`}>
              <p className="font-medium">{message}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Authentication Actions</h2>

                {status === 'authenticated' ? (
                  <div className="space-y-4">
                    <button
                      onClick={handleSignOut}
                      className="w-full py-2 px-4 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                      disabled={loading}
                    >
                      Sign Out
                    </button>

                    <button
                      onClick={handleRefreshSession}
                      className="w-full py-2 px-4 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                      disabled={loading}
                    >
                      Refresh Session
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSignIn} className="space-y-4">
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="your@email.com"
                        disabled={loading}
                      />
                    </div>

                    <div>
                      <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                        Password
                      </label>
                      <input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="••••••••"
                        disabled={loading}
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2 px-4 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                      disabled={loading}
                    >
                      Sign In
                    </button>

                    <div className="text-center">
                      <button
                        type="button"
                        onClick={() => {
                          setEmail('test@example.com');
                          setPassword('password123');
                        }}
                        className="text-sm text-indigo-600 hover:text-indigo-500"
                      >
                        Fill Test Credentials
                      </button>
                    </div>
                  </form>
                )}
              </div>

              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Debug Information</h2>

                {debugInfo ? (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <pre className="text-xs overflow-auto bg-gray-100 p-2 rounded max-h-80">
                      {JSON.stringify(debugInfo, null, 2)}
                    </pre>
                  </div>
                ) : (
                  <p className="text-gray-500">No debug information available</p>
                )}
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/home"
                  className="inline-flex items-center gap-2 rounded-lg bg-gray-200 px-4 py-2 text-gray-700 hover:bg-gray-300"
                >
                  Back to Home
                </Link>

                <Link
                  href="/auth-test"
                  className="inline-flex items-center gap-2 rounded-lg bg-gray-200 px-4 py-2 text-gray-700 hover:bg-gray-300"
                >
                  Auth Test
                </Link>

                <Link
                  href="/account/signin-new"
                  className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
                >
                  New Sign In
                </Link>

                <Link
                  href="/counselor/sessions"
                  className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700"
                >
                  Counselor Sessions
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
