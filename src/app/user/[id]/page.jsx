"use client";
import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/utils/supabaseClient';
import { useUser } from '@/utils/useUser';
import { useNotification } from '@/context/NotificationContext';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';
import Link from 'next/link';

export default function UserProfilePage() {
  const params = useParams();
  const userId = params.id;
  const { data: currentUser, loading: userLoading } = useUser();
  const { showSuccess, showError } = useNotification();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (userId) {
      fetchUserProfile();
    }
  }, [userId]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get user profile
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) {
        throw profileError;
      }

      setProfile(profileData);
    } catch (err) {
      console.error('Error fetching user profile:', err);
      setError('Failed to load user profile. Please try again.');
      showError('Failed to load user profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : error ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
            <p className="text-gray-600 max-w-md mx-auto">{error}</p>
            <Link href="/home" className="mt-6 inline-block px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
              Back to Home
            </Link>
          </div>
        ) : profile ? (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-6 sm:p-8 border-b border-gray-200">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-xl font-semibold">
                    {profile.display_name ? profile.display_name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">{profile.display_name}</h1>
                    {profile.role && (
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                        profile.role === 'counselor' 
                          ? 'bg-green-100 text-green-800' 
                          : profile.role === 'admin' 
                            ? 'bg-purple-100 text-purple-800' 
                            : 'bg-blue-100 text-blue-800'
                      }`}>
                        {profile.role}
                      </span>
                    )}
                  </div>
                </div>
                
                {currentUser && currentUser.id !== userId && profile.role === 'counselor' && (
                  <Link 
                    href={`/book-session?counselor=${profile.id}`}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    Book a Session
                  </Link>
                )}
              </div>
            </div>

            <div className="p-6 sm:p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">About</h2>
                  {profile.bio ? (
                    <p className="text-gray-700">{profile.bio}</p>
                  ) : (
                    <p className="text-gray-500 italic">No bio provided</p>
                  )}

                  {profile.role === 'counselor' && profile.professional_bio && (
                    <div className="mt-6">
                      <h3 className="text-md font-semibold text-gray-900 mb-2">Professional Background</h3>
                      <p className="text-gray-700">{profile.professional_bio}</p>
                    </div>
                  )}
                </div>

                <div>
                  {profile.role === 'counselor' && (
                    <>
                      {profile.specializations && profile.specializations.length > 0 && (
                        <div className="mb-6">
                          <h3 className="text-md font-semibold text-gray-900 mb-2">Specializations</h3>
                          <div className="flex flex-wrap gap-2">
                            {profile.specializations.map((specialization, index) => (
                              <span 
                                key={index}
                                className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm"
                              >
                                {specialization}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {profile.years_experience && (
                        <div className="mb-6">
                          <h3 className="text-md font-semibold text-gray-900 mb-2">Experience</h3>
                          <p className="text-gray-700">{profile.years_experience} years</p>
                        </div>
                      )}

                      {profile.credentials && (
                        <div className="mb-6">
                          <h3 className="text-md font-semibold text-gray-900 mb-2">Credentials</h3>
                          <p className="text-gray-700">{profile.credentials}</p>
                        </div>
                      )}
                    </>
                  )}

                  {profile.mental_health_interests && profile.mental_health_interests.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-md font-semibold text-gray-900 mb-2">Interests</h3>
                      <div className="flex flex-wrap gap-2">
                        {profile.mental_health_interests.map((interest, index) => (
                          <span 
                            key={index}
                            className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm"
                          >
                            {interest}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">User Not Found</h2>
            <p className="text-gray-600 max-w-md mx-auto">
              The user profile you're looking for doesn't exist or has been removed.
            </p>
            <Link href="/home" className="mt-6 inline-block px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
              Back to Home
            </Link>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
