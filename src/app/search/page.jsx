"use client";
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useUser } from '@/utils/useUser';
import { useNotification } from '@/context/NotificationContext';
import Navbar from '@/components/ui/Navbar';

export default function SearchPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const { data: user } = useUser();
  const { showInfo, showError } = useNotification();

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
      // This is a mock search function
      // In a real application, you would call an API endpoint
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      // Mock results
      const mockResults = [
        { id: 1, title: 'Mental Health Resources', type: 'page', url: '/resources' },
        { id: 2, title: 'Anxiety Management Techniques', type: 'article', url: '/articles/anxiety' },
        { id: 3, title: 'Depression Support Group', type: 'community', url: '/community/depression' },
        { id: 4, title: 'Mindfulness Meditation', type: 'resource', url: '/resources/mindfulness' },
      ].filter(item => 
        item.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      setResults(mockResults);
      showInfo(`Found ${mockResults.length} results for "${searchTerm}"`);
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
                >
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900 hover:text-primary-600 transition-colors">
                    {result.title}
                  </h2>
                  <div className="flex items-center mt-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 capitalize">
                      {result.type}
                    </span>
                    <span className="text-sm text-gray-500 ml-2">
                      {result.url}
                    </span>
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
