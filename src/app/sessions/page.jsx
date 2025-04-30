"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/utils/useUser";
import { supabase } from "@/utils/supabaseClient";
import { ModernSpinner } from "@/components/ui/ModernUI";
import Navbar from "@/components/ui/Navbar";

export default function SessionsRedirectPage() {
  const router = useRouter();
  const { data: user, loading: userLoading } = useUser();
  const [redirecting, setRedirecting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (userLoading) return;

    const redirectBasedOnRole = async () => {
      if (!user) {
        // If not logged in, redirect to sign in page
        router.push("/account/signin?redirect=/sessions");
        return;
      }

      setRedirecting(true);

      try {
        // Get user role from profile
        const { data: profile, error } = await supabase
          .from('user_profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching user role:', error);
          setError('Could not determine your user role. Please try again later.');
          // Don't redirect if there's an error - show the error message instead
          setRedirecting(false);
          return;
        }

        // Redirect based on role
        if (profile.role === 'counselor') {
          router.push("/counselor/sessions-direct");
        } else {
          router.push("/counseling/sessions");
        }
      } catch (err) {
        console.error('Error in role redirect:', err);
        setError('An unexpected error occurred. Please try again later.');
        setRedirecting(false);
      }
    };

    redirectBasedOnRole();
  }, [user, userLoading, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <Navbar />
      <div className="pt-20 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          {error ? (
            <>
              <div className="text-red-500 mb-4">
                <svg className="h-12 w-12 mx-auto text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h1 className="text-xl font-semibold text-gray-800 mb-4">Error Loading Sessions</h1>
              <p className="text-gray-600 mb-6">{error}</p>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Try Again
                </button>
                <button
                  onClick={() => router.push('/home')}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                >
                  Go to Home
                </button>
              </div>
            </>
          ) : (
            <>
              <ModernSpinner size="large" className="mx-auto" />
              <h1 className="mt-6 text-xl font-semibold text-gray-800">Redirecting to your sessions</h1>
              <p className="mt-2 text-gray-600">Please wait while we take you to the appropriate page...</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
