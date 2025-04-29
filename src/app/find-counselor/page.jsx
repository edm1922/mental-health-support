"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "@/utils/supabaseClient";
import Link from "next/link";

export default function FindCounselorPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [counselors, setCounselors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Load all counselors on initial page load
    searchCounselors();
  }, []);

  const searchCounselors = async () => {
    try {
      setLoading(true);
      setError(null);

      // Build the query to search for counselors
      let query = supabase
        .from('user_profiles')
        .select('id, display_name, bio, specializations')
        .eq('role', 'counselor');

      // Add search term filter if provided
      if (searchTerm) {
        query = query.or(`display_name.ilike.%${searchTerm}%,bio.ilike.%${searchTerm}%,specializations.ilike.%${searchTerm}%`);
      }

      // Execute the query
      const { data, error } = await query;

      if (error) {
        throw new Error('Failed to search counselors');
      }

      setCounselors(data || []);
    } catch (err) {
      console.error('Error searching counselors:', err);
      setError(err.message || 'An error occurred while searching for counselors');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    searchCounselors();
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">Find a Counselor</h1>
        <p className="text-center text-gray-600 mb-8">Search for a counselor to help with your mental health journey</p>

        <form onSubmit={handleSearch} className="mb-8 max-w-xl mx-auto">
          <div className="flex gap-2">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name or specialization..."
              className="flex-grow px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg disabled:opacity-50"
            >
              {loading ? "Searching..." : "Search"}
            </button>
          </div>
        </form>

        {error && (
          <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-6 max-w-xl mx-auto">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading counselors...</p>
          </div>
        ) : counselors.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <p className="text-gray-600">No counselors found</p>
            <p className="text-sm text-gray-500 mt-2">Try a different search term or browse all counselors</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {counselors.map((counselor) => (
              <div key={counselor.id} className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
                <h3 className="text-xl font-semibold text-gray-800 mb-2">{counselor.display_name || 'Unnamed Counselor'}</h3>

                {counselor.specializations && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {typeof counselor.specializations === 'string'
                      ? counselor.specializations.split(',').map((spec, index) => (
                          <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm">
                            {spec.trim()}
                          </span>
                        ))
                      : Array.isArray(counselor.specializations)
                        ? counselor.specializations.map((spec, index) => (
                            <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm">
                              {typeof spec === 'string' ? spec.trim() : spec}
                            </span>
                          ))
                        : (
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm">
                              {String(counselor.specializations)}
                            </span>
                          )
                    }
                  </div>
                )}

                {counselor.bio && (
                  <p className="mt-3 text-gray-600">
                    {typeof counselor.bio === 'string'
                      ? `${counselor.bio.substring(0, 150)}${counselor.bio.length > 150 ? '...' : ''}`
                      : String(counselor.bio)
                    }
                  </p>
                )}

                <div className="mt-4 flex justify-end">
                  <Link
                    href={`/counselor-profile/${counselor.id}`}
                    className="inline-block bg-white border border-blue-500 text-blue-500 hover:bg-blue-50 px-4 py-2 rounded-lg"
                  >
                    View Profile
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 text-center">
          <Link href="/" className="text-blue-500 hover:underline">
            Return to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
