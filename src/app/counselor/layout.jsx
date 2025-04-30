"use client";

import React, { useState, useEffect } from "react";
import { useUser } from '@/utils/useUser';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabaseClient';
import { useAuth } from '@/utils/useAuth';
import Link from 'next/link';

export default function CounselorLayout({ children }) {
  const router = useRouter();
  const { data: user, loading: userLoading } = useUser();
  const { signOut } = useAuth();
  const [isCounselor, setIsCounselor] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/signin');
    } catch (err) {
      console.error('Error signing out:', err);
      setError('Failed to sign out. Please try again.');
    }
  };

  useEffect(() => {
    if (user) {
      checkCounselorStatus();
    } else if (!userLoading) {
      // User is not logged in
      router.push('/signin?redirect=/counselor');
    }
  }, [user, userLoading]);

  const checkCounselorStatus = async () => {
    try {
      console.log("Checking counselor status for user:", user.id);
      // Check if the user is a counselor
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error("Profile check error:", profileError);
        setError(`Profile check failed: ${profileError.message || 'Unknown error'}`);
        setLoading(false);
        return;
      }

      if (!profile || profile.role !== 'counselor') {
        console.log("User is not a counselor, redirecting to home");
        setError("You do not have counselor privileges. If you believe this is an error, please contact support.");
        setLoading(false);
        router.push('/home');
        return;
      }

      setIsCounselor(true);
      setLoading(false);
    } catch (err) {
      console.error("Error checking counselor status:", err);
      setError(err.message || "Failed to verify counselor status");
      setLoading(false);
    }
  };

  if (userLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-xl p-8 max-w-md w-full">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link href="/home" className="block w-full bg-green-600 text-white text-center py-2 px-4 rounded-lg hover:bg-green-700">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-xl p-8 max-w-md w-full">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Authentication Required</h1>
          <p className="text-gray-600 mb-6">Please sign in to access the counselor area.</p>
          <Link href="/signin?redirect=/counselor" className="block w-full bg-green-600 text-white text-center py-2 px-4 rounded-lg hover:bg-green-700">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  if (!isCounselor) {
    return null; // This will be handled by the redirect in checkCounselorStatus
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-green-800 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link href="/counselor" className="font-bold text-xl">
                  Counselor Portal
                </Link>
              </div>
              <div className="hidden md:ml-6 md:flex md:items-center md:space-x-4">
                <Link href="/counselor" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-green-700">
                  Dashboard
                </Link>
                <Link href="/counselor/sessions" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-green-700">
                  My Sessions
                </Link>
                <Link href="/counselor/patients" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-green-700">
                  Patient Check-ins
                </Link>
                <Link href="/counselor/profile" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-green-700">
                  My Profile
                </Link>
              </div>
            </div>
            <div className="flex items-center">
              <Link href="/home" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-green-700">
                Back to Site
              </Link>
              <button
                onClick={handleSignOut}
                className="px-3 py-2 rounded-md text-sm font-medium hover:bg-green-700 text-white"
              >
                Sign Out
              </button>
              <div className="ml-3 relative">
                <div className="flex items-center">
                  <span className="hidden md:inline-block mr-2">{user.email}</span>
                  <div className="h-8 w-8 rounded-full bg-green-600 flex items-center justify-center">
                    {user.email ? user.email.charAt(0).toUpperCase() : 'U'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {children}
        </div>
      </div>
    </div>
  );
}
