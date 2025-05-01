"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabaseClient';
import Link from 'next/link';

export default function DirectCounselorPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Clear any existing localStorage items that might be causing issues
    Object.keys(localStorage).forEach(key => {
      if (key.includes('signin') || key.includes('redirect') || key.includes('justSignedIn')) {
        localStorage.removeItem(key);
      }
    });
  }, []);

  const handleDirectAccess = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(false);
      
      // First sign out to clear any existing session
      await supabase.auth.signOut();
      
      // Sign in as counselor
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'counselor1@example.com',
        password: 'counselor'
      });
      
      if (error) {
        setError(`Sign-in error: ${error.message}`);
        return;
      }
      
      if (!data.user) {
        setError('No user returned from sign-in');
        return;
      }
      
      setSuccess(true);
      
      // Wait a moment for the session to be established
      setTimeout(() => {
        // Navigate directly to the counselor dashboard
        window.location.href = '/counselor/dashboard';
      }, 1500);
      
    } catch (err) {
      setError(`Unexpected error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-2xl font-bold text-center mb-6">Direct Counselor Access</h1>
        
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            <p className="font-medium">Error</p>
            <p>{error}</p>
          </div>
        )}
        
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
            <p className="font-medium">Success!</p>
            <p>Successfully signed in as counselor. Redirecting to dashboard...</p>
            <div className="mt-2 flex justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-green-500 border-t-transparent"></div>
            </div>
          </div>
        )}
        
        <div className="space-y-6">
          <p className="text-gray-600">
            This page provides a direct way to access the counselor dashboard, bypassing the normal sign-in flow that might be causing issues.
          </p>
          
          <button
            onClick={handleDirectAccess}
            disabled={loading || success}
            className={`w-full py-3 px-4 rounded-lg text-white font-medium ${
              loading || success ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <span className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></span>
                Signing in...
              </span>
            ) : success ? (
              'Signed in successfully!'
            ) : (
              'Sign in as Counselor'
            )}
          </button>
          
          <div className="pt-4 border-t border-gray-200">
            <div className="flex justify-between">
              <Link href="/debug-auth" className="text-blue-600 hover:text-blue-800">
                Debug Auth Page
              </Link>
              <Link href="/" className="text-blue-600 hover:text-blue-800">
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
