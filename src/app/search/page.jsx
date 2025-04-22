"use client";
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useUser } from '@/utils/useUser';
import { useNotification } from '@/context/NotificationContext';
import Navbar from '@/components/ui/Navbar';
import { supabase } from '@/utils/supabaseClient';

export default function SearchPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const { data: user } = useUser();
  const { showSuccess, showError } = useNotification();

  useEffect(() => {
    if (query) {
      performSearch(query);
    } else {
      setLoading(false);
      setResults([]);
    }
  }, [query]);

  const performSearch = async (searchTerm) => {
    setLoading(true);
    try {
      let formattedResults = [];

      try {
        // Search in community posts
        const { data: communityPosts, error: communityError } = await supabase
          .from('community_posts')
          .select('id, title, content, created_at, approved')
          .or(`title.ilike.%${searchTerm}%, content.ilike.%${searchTerm}%`)
          .order('created_at', { ascending: false })
          .limit(10);

        if (!communityError && communityPosts) {
          // Filter approved posts if the column exists
          const filteredPosts = communityPosts.filter(post => post.approved === undefined || post.approved === true);

          formattedResults = [
            ...formattedResults,
            ...filteredPosts.map(post => ({
              id: `community-${post.id}`,
              title: post.title,
              excerpt: post.content?.substring(0, 150) + '...',
              type: 'Community Post',
              url: `/community/post/${post.id}`,
              date: new Date(post.created_at).toLocaleDateString()
            }))
          ];
        }
      } catch (communityError) {
        console.error('Error searching community posts:', communityError);
        // Continue with other searches
      }

      try {
        // Search in user profiles (display names)
        const { data: userProfiles, error: userProfilesError } = await supabase
          .from('user_profiles')
          .select('*')
          .ilike('display_name', `%${searchTerm}%`)
          .order('display_name', { ascending: true })
          .limit(10);

        if (!userProfilesError && userProfiles) {
          console.log('Found user profiles:', userProfiles);
          formattedResults = [
            ...formattedResults,
            ...userProfiles.map(profile => {
              // Create a user-friendly excerpt from available profile data
              let excerptParts = [];
              if (profile.bio) excerptParts.push(profile.bio);
              if (profile.professional_bio) excerptParts.push(profile.professional_bio);
              if (profile.role === 'counselor' && profile.specializations?.length > 0) {
                excerptParts.push(`Specializations: ${profile.specializations.join(', ')}`);
              }
              if (profile.mental_health_interests?.length > 0) {
                excerptParts.push(`Interests: ${profile.mental_health_interests.join(', ')}`);
              }

              const excerpt = excerptParts.length > 0
                ? excerptParts.join(' | ').substring(0, 150) + (excerptParts.join(' | ').length > 150 ? '...' : '')
                : 'User profile';

              return {
                id: `user-${profile.id}`,
                title: profile.display_name || 'User',
                excerpt: excerpt,
                type: profile.role === 'counselor' ? 'Counselor' : 'User',
                url: profile.role === 'counselor' ? `/counselor/profile/${profile.id}` : `/profile`,
                badge: profile.role === 'counselor' ? 'Counselor' : (profile.role === 'admin' ? 'Admin' : null)
              };
            })
          ];
        }
      } catch (userProfilesError) {
        console.error('Error searching user profiles:', userProfilesError);
        // Continue with other searches
      }

      // Only show success message if we have results
      if (formattedResults.length > 0) {
        setResults(formattedResults);
        showSuccess(`Found ${formattedResults.length} results for "${searchTerm}"`);
      } else {
        setResults([]);
        // Don't show an error, just show the empty state
      }
    } catch (error) {
      console.error('Search error:', error);
      showError('Failed to perform search. Please try again.');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Search Results
          </h1>
          {query && (
            <p className="text-gray-600">
              Showing results for: <span className="font-medium">"{query}"</span>
            </p>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : results.length > 0 ? (
          <div className="space-y-4">
            {results.map((result) => (
              <div
                key={result.id}
                className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-4 sm:p-6"
              >
                <a
                  href={result.url}
                  className="block"
                  target={result.type === 'Resource' ? '_blank' : '_self'}
                  rel={result.type === 'Resource' ? 'noopener noreferrer' : ''}
                >
                  <div className="flex items-center">
                    <h2 className="text-lg sm:text-xl font-semibold text-gray-900 hover:text-primary-600 transition-colors">
                      {result.title}
                    </h2>
                    {result.badge && (
                      <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${result.badge === 'Counselor' ? 'bg-green-100 text-green-800' : 'bg-purple-100 text-purple-800'}`}>
                        {result.badge}
                      </span>
                    )}
                  </div>
                  {result.excerpt && (
                    <p className="text-gray-600 mt-2 mb-3">{result.excerpt}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 capitalize">
                      {result.type}
                    </span>
                    {result.category && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {result.category}
                      </span>
                    )}
                    {result.date && (
                      <span className="text-xs text-gray-500">
                        {result.date}
                      </span>
                    )}
                  </div>
                </a>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            {query ? (
              <>
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">No results found</h2>
                <p className="text-gray-600 max-w-md mx-auto">
                  We couldn't find any matches for "{query}". Try checking your spelling or using different keywords.
                </p>
              </>
            ) : (
              <>
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Search for something</h2>
                <p className="text-gray-600 max-w-md mx-auto">
                  Use the search bar above to find resources, articles, and community discussions.
                </p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
