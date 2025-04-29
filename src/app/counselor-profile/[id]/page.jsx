"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "@/utils/supabaseClient";
import Link from "next/link";

export default function CounselorProfilePage({ params }) {
  const [counselor, setCounselor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (params?.id) {
      fetchCounselorProfile(params.id);
    }
  }, [params?.id]);

  const fetchCounselorProfile = async (counselorId) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', counselorId)
        .single();

      if (error) {
        throw new Error('Failed to fetch counselor profile');
      }

      setCounselor(data);
    } catch (err) {
      console.error('Error fetching counselor profile:', err);
      setError(err.message || 'An error occurred while fetching the counselor profile');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading counselor profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <div className="bg-white rounded-lg shadow-md p-6 max-w-md w-full">
          <h1 className="text-xl font-bold text-red-500 mb-4">Error</h1>
          <p className="text-gray-700 mb-4">{error}</p>
          <Link href="/" className="text-blue-500 hover:underline">
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  if (!counselor) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <div className="bg-white rounded-lg shadow-md p-6 max-w-md w-full">
          <h1 className="text-xl font-bold text-gray-800 mb-4">Counselor Not Found</h1>
          <p className="text-gray-700 mb-4">The counselor profile you're looking for could not be found.</p>
          <Link href="/" className="text-blue-500 hover:underline">
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center">
            <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center text-white text-2xl font-bold mb-4 md:mb-0 md:mr-6">
              {counselor.display_name ? counselor.display_name.charAt(0).toUpperCase() : 'C'}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">{counselor.display_name || 'Unnamed Counselor'}</h1>
              <p className="text-gray-600">{counselor.role === 'counselor' ? 'Professional Counselor' : 'User'}</p>
            </div>
          </div>

          <div className="mt-6 border-t pt-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">About</h2>
            <p className="text-gray-700">
              {counselor.bio || 'No bio information available for this counselor.'}
            </p>
          </div>

          <div className="mt-6 border-t pt-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Specializations</h2>
            <div className="flex flex-wrap gap-2">
              {counselor.specializations ? (
                typeof counselor.specializations === 'string' ? (
                  counselor.specializations.split(',').map((spec, index) => (
                    <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                      {spec.trim()}
                    </span>
                  ))
                ) : Array.isArray(counselor.specializations) ? (
                  counselor.specializations.map((spec, index) => (
                    <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                      {spec}
                    </span>
                  ))
                ) : (
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                    {String(counselor.specializations)}
                  </span>
                )
              ) : (
                <span className="text-gray-500">No specializations listed</span>
              )}
            </div>
          </div>

          <div className="mt-6 border-t pt-6 flex justify-between">
            <Link href="/" className="text-blue-500 hover:underline">
              Return to Home
            </Link>
            <Link href="/find-counselor" className="text-blue-500 hover:underline">
              Find More Counselors
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
