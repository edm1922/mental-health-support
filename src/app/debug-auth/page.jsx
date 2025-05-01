'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabaseClient';
import Link from 'next/link';

export default function DebugAuthPage() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [localStorageItems, setLocalStorageItems] = useState({});

  useEffect(() => {
    async function checkAuth() {
      try {
        setLoading(true);
        
        // Get current session
        const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          throw new Error(`Session error: ${sessionError.message}`);
        }
        
        setSession(currentSession);
        
        // If we have a session, get the user profile
        if (currentSession?.user) {
          const { data: userProfile, error: profileError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', currentSession.user.id)
            .single();
            
          if (profileError && profileError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
            console.warn('Profile fetch error:', profileError);
          }
          
          setProfile(userProfile || null);
        }
        
        // Get localStorage items
        const storageItems = {};
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          try {
            // Try to parse as JSON
            const value = localStorage.getItem(key);
            try {
              storageItems[key] = JSON.parse(value);
            } catch {
              // If not valid JSON, store as string
              storageItems[key] = value;
            }
          } catch (e) {
            storageItems[key] = `[Error reading value: ${e.message}]`;
          }
        }
        setLocalStorageItems(storageItems);
        
      } catch (err) {
        console.error('Debug auth error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    
    checkAuth();
  }, []);
  
  const handleSignOut = async () => {
    try {
      setLoading(true);
      await supabase.auth.signOut();
      setSession(null);
      setProfile(null);
      window.location.reload();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  const clearLocalStorage = () => {
    localStorage.clear();
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Authentication Debug Page</h1>
            <div className="space-x-2">
              <button 
                onClick={handleSignOut}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                Sign Out
              </button>
              <button 
                onClick={clearLocalStorage}
                className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600"
              >
                Clear localStorage
              </button>
              <Link href="/" className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 inline-block">
                Home
              </Link>
            </div>
          </div>
          
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 mb-6">
              <p className="font-medium">Error</p>
              <p>{error}</p>
            </div>
          ) : (
            <div className="space-y-8">
              <div>
                <h2 className="text-xl font-semibold mb-3">Session Status</h2>
                <div className="p-4 bg-gray-50 rounded-lg overflow-auto max-h-60">
                  {session ? (
                    <div>
                      <div className="mb-2 p-2 bg-green-50 text-green-700 rounded">
                        ✅ User is signed in
                      </div>
                      <pre className="text-sm overflow-auto">{JSON.stringify(session, null, 2)}</pre>
                    </div>
                  ) : (
                    <div className="p-2 bg-yellow-50 text-yellow-700 rounded">
                      ⚠️ No active session found
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <h2 className="text-xl font-semibold mb-3">User Profile</h2>
                <div className="p-4 bg-gray-50 rounded-lg overflow-auto max-h-60">
                  {profile ? (
                    <div>
                      <div className="mb-2 p-2 bg-green-50 text-green-700 rounded">
                        ✅ Profile found
                      </div>
                      <pre className="text-sm overflow-auto">{JSON.stringify(profile, null, 2)}</pre>
                    </div>
                  ) : session ? (
                    <div className="p-2 bg-yellow-50 text-yellow-700 rounded">
                      ⚠️ User is signed in but no profile found
                    </div>
                  ) : (
                    <div className="p-2 bg-gray-100 text-gray-500 rounded">
                      No profile (user not signed in)
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <h2 className="text-xl font-semibold mb-3">localStorage Items</h2>
                <div className="p-4 bg-gray-50 rounded-lg overflow-auto max-h-60">
                  {Object.keys(localStorageItems).length > 0 ? (
                    <pre className="text-sm overflow-auto">{JSON.stringify(localStorageItems, null, 2)}</pre>
                  ) : (
                    <div className="p-2 bg-gray-100 text-gray-500 rounded">
                      No items in localStorage
                    </div>
                  )}
                </div>
              </div>
              
              <div className="pt-4 border-t border-gray-200">
                <h2 className="text-xl font-semibold mb-3">Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Link 
                    href="/direct-counselor" 
                    className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 hover:bg-blue-100"
                  >
                    Direct Counselor Access
                  </Link>
                  <Link 
                    href="/account/signin" 
                    className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 hover:bg-blue-100"
                  >
                    Regular Sign-in Page
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
