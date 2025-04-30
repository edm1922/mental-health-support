"use client";
import React, { useState, useEffect } from "react";
import { useUser } from "@/utils/useUser";
import { supabase } from "@/utils/supabaseClient";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  GlassContainer,
  GlassCard,
  BackButton,
  ModernButton,
  ModernHeading,
  ModernAlert,
  ModernSpinner,
  ModernInput
} from "@/components/ui/ModernUI";

export default function CounselorSearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: user, loading: userLoading } = useUser();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [counselors, setCounselors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (user) {
      searchCounselors();
    }
  }, [user, page]);

  const searchCounselors = async (newSearch = false) => {
    try {
      if (newSearch) {
        setPage(1);
      }

      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/counselor/search?q=${encodeURIComponent(searchTerm)}&page=${newSearch ? 1 : page}&pageSize=10`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to search counselors');
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to search counselors');
      }

      setCounselors(data.counselors);
      setTotalPages(data.pagination.totalPages);
    } catch (err) {
      console.error('Error searching counselors:', err);
      setError(err.message || 'An error occurred while searching for counselors');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    searchCounselors(true);
  };

  const handlePrevPage = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };

  const handleNextPage = () => {
    if (page < totalPages) {
      setPage(page + 1);
    }
  };

  if (userLoading) {
    return (
      <GlassContainer className="flex items-center justify-center">
        <ModernSpinner size="large" />
      </GlassContainer>
    );
  }

  if (!user) {
    return (
      <GlassContainer className="flex flex-col items-center justify-center">
        <GlassCard className="w-full max-w-md text-center">
          <ModernHeading level={1}>Sign In Required</ModernHeading>
          <p className="mb-6 text-gray-600">
            Please sign in to search for counselors.
          </p>
          <ModernButton
            onClick={() => window.location.href = "/account/signin"}
          >
            Sign In
          </ModernButton>
        </GlassCard>
      </GlassContainer>
    );
  }

  return (
    <GlassContainer>
      <BackButton />
      <GlassCard className="mb-8 backdrop-blur-md">
        <ModernHeading level={1} className="text-center">
          Find a Counselor
        </ModernHeading>
        <p className="text-center text-gray-600 mb-6">
          Search for a counselor to help with your mental health journey
        </p>

        <form onSubmit={handleSearch} className="mb-6">
          <div className="flex gap-2">
            <ModernInput
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name or specialization..."
              className="flex-grow"
            />
            <ModernButton type="submit" disabled={loading}>
              {loading ? "Searching..." : "Search"}
            </ModernButton>
          </div>
        </form>

        {error && (
          <ModernAlert type="error" className="mb-4">
            {error}
          </ModernAlert>
        )}

        <div className="space-y-4">
          {loading && counselors.length === 0 ? (
            <div className="text-center py-8">
              <ModernSpinner />
              <p className="mt-2 text-gray-500">Searching for counselors...</p>
            </div>
          ) : counselors.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No counselors found</p>
              <p className="text-sm text-gray-400 mt-2">Try a different search term or browse all counselors</p>
            </div>
          ) : (
            <>
              {counselors.map((counselor) => (
                <div key={counselor.id} className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                  <h3 className="text-lg font-semibold text-gray-800">{counselor.display_name || 'Unnamed Counselor'}</h3>

                  {counselor.specializations && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {counselor.specializations.split(',').map((spec, index) => (
                        <span key={index} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                          {spec.trim()}
                        </span>
                      ))}
                    </div>
                  )}

                  {counselor.bio && (
                    <p className="mt-2 text-gray-600 text-sm">{counselor.bio.substring(0, 150)}...</p>
                  )}

                  <div className="mt-3 flex justify-end">
                    <Link href={`/counselor-profile/${counselor.id}`}>
                      <ModernButton size="small" variant="outline">
                        View Profile
                      </ModernButton>
                    </Link>
                  </div>
                </div>
              ))}

              {totalPages > 1 && (
                <div className="flex justify-between items-center mt-6">
                  <ModernButton
                    onClick={handlePrevPage}
                    disabled={page === 1 || loading}
                    variant="outline"
                  >
                    Previous
                  </ModernButton>

                  <span className="text-gray-600">
                    Page {page} of {totalPages}
                  </span>

                  <ModernButton
                    onClick={handleNextPage}
                    disabled={page === totalPages || loading}
                    variant="outline"
                  >
                    Next
                  </ModernButton>
                </div>
              )}
            </>
          )}
        </div>
      </GlassCard>
    </GlassContainer>
  );
}
