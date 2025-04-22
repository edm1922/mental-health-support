"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabaseClient';
import Link from 'next/link';

export default function AuthStatusPage() {
  const [session, setSession] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    async function checkAuth() {
      try {
        setLoading(true);
        setError(null);
        
        // Get current session
        const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          throw new Error(`Session error: ${sessionError.message}`);
        }
        
        setSession(currentSession);
        
        if (currentSession) {
          // Get user profile
          const { data: profile, error: profileError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', currentSession.user.id)
            .single();
          
          if (profileError && profileError.code !== 'PGRST116') { // Not found is ok
            console.warn('Profile error:', profileError);
          }
          
          setUserProfile(profile || null);
        }
      } catch (err) {
        console.error('Auth check error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    
    checkAuth();
    
    // Set up auth state change listener
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      
      if (newSession) {
        // Get user profile on auth change
        supabase
          .from('user_profiles')
          .select('*')
          .eq('id', newSession.user.id)
          .single()
          .then(({ data }) => {
            setUserProfile(data || null);
          })
          .catch(err => {
            console.warn('Profile fetch error on auth change:', err);
          });
      } else {
        setUserProfile(null);
      }
    });
    
    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);
  
  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw error;
      }
      
      // Clear state
      setSession(null);
      setUserProfile(null);
    } catch (err) {
      console.error('Sign out error:', err);
      setError(`Sign out failed: ${err.message}`);
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-gray-600 shadow-md hover:bg-gray-50"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              strokeWidth="2"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back to Home
          </Link>
        </div>
        
        <div className="rounded-2xl bg-white p-6 shadow-xl md:p-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">Authentication Status</h1>
          
          {loading && (
            <div className="flex justify-center py-8">
              <div className="animate-spin h-8 w-8 rounded-full border-t-2 border-b-2 border-blue-500"></div>
            </div>
          )}
          
          {error && (
            <div className="rounded-lg bg-red-50 p-4 text-red-700 mb-6">
              <p className="font-medium">Error:</p>
              <p>{error}</p>
            </div>
          )}
          
          {!loading && (
            <div>
              <div className="mb-8 rounded-lg bg-gray-50 p-4">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Authentication</h2>
                <div className="space-y-2">
                  <p>
                    <span className="font-medium">Status:</span>{' '}
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      session ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {session ? 'Authenticated' : 'Not Authenticated'}
                    </span>
                  </p>
                  
                  {session && (
                    <>
                      <p>
                        <span className="font-medium">User ID:</span>{' '}
                        <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">{session.user.id}</span>
                      </p>
                      <p>
                        <span className="font-medium">Email:</span>{' '}
                        {session.user.email}
                      </p>
                      <p>
                        <span className="font-medium">Last Sign In:</span>{' '}
                        {new Date(session.user.last_sign_in_at).toLocaleString()}
                      </p>
                    </>
                  )}
                </div>
              </div>
              
              {session && (
                <div className="mb-8 rounded-lg bg-gray-50 p-4">
                  <h2 className="text-lg font-semibold text-gray-800 mb-4">User Profile</h2>
                  
                  {userProfile ? (
                    <div className="space-y-2">
                      <p>
                        <span className="font-medium">Display Name:</span>{' '}
                        {userProfile.display_name}
                      </p>
                      <p>
                        <span className="font-medium">Role:</span>{' '}
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          userProfile.role === 'admin' 
                            ? 'bg-purple-100 text-purple-800' 
                            : userProfile.role === 'counselor'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800'
                        }`}>
                          {userProfile.role}
                        </span>
                      </p>
                      <p>
                        <span className="font-medium">Created:</span>{' '}
                        {new Date(userProfile.created_at).toLocaleString()}
                      </p>
                      {userProfile.bio && (
                        <p>
                          <span className="font-medium">Bio:</span>{' '}
                          {userProfile.bio}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="rounded-lg bg-yellow-50 p-4 text-yellow-700">
                      <p className="font-medium">No user profile found</p>
                      <p className="mt-1">Your user profile hasn't been created yet.</p>
                      <Link
                        href="/fix-auth"
                        className="mt-3 inline-block rounded-lg bg-yellow-100 px-4 py-2 text-yellow-800 hover:bg-yellow-200"
                      >
                        Create Profile
                      </Link>
                    </div>
                  )}
                </div>
              )}
              
              <div className="flex flex-wrap gap-4">
                {session ? (
                  <button
                    onClick={handleSignOut}
                    className="rounded-lg bg-red-500 px-4 py-2 text-white hover:bg-red-600"
                  >
                    Sign Out
                  </button>
                ) : (
                  <Link
                    href="/account/signin?redirect=/auth-status"
                    className="rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
                  >
                    Sign In
                  </Link>
                )}
                
                <Link
                  href="/fix-auth"
                  className="rounded-lg bg-green-500 px-4 py-2 text-white hover:bg-green-600"
                >
                  Fix Authentication
                </Link>
                
                <Link
                  href="/simple-messages"
                  className="rounded-lg bg-purple-500 px-4 py-2 text-white hover:bg-purple-600"
                >
                  View Messages
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
