'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabaseClient';

export default function BypassPage() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Get current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          setError(`Session error: ${sessionError.message}`);
          setLoading(false);
          return;
        }
        
        if (!session) {
          setError('No active session found. Please sign in first.');
          setLoading(false);
          return;
        }
        
        setUser(session.user);
        
        // Get user profile
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('role, display_name')
          .eq('id', session.user.id)
          .single();
          
        if (profileError) {
          setError(`Error fetching profile: ${profileError.message}`);
          setLoading(false);
          return;
        }
        
        setProfile(profile);
        setLoading(false);
      } catch (error) {
        setError(`Unexpected error: ${error.message}`);
        setLoading(false);
      }
    };
    
    checkAuth();
  }, []);
  
  const handleBypass = () => {
    if (!profile) return;
    
    let redirectUrl = '/home';
    
    if (profile.role === 'counselor') {
      redirectUrl = '/counselor/dashboard';
    } else if (profile.role === 'admin') {
      redirectUrl = '/admin/dashboard';
    }
    
    // Use direct navigation
    window.location.href = redirectUrl;
  };
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Loading...</h1>
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full p-8 bg-white rounded-xl shadow-md">
        <h1 className="text-2xl font-bold text-center mb-6">Bypass Middleware</h1>
        
        {error ? (
          <div className="bg-red-100 text-red-700 p-4 rounded-md mb-4">
            <p>{error}</p>
          </div>
        ) : (
          <div className="mb-6">
            <div className="bg-gray-100 p-4 rounded-md mb-4">
              <h2 className="text-lg font-semibold mb-2">User Information</h2>
              <p><strong>Email:</strong> {user?.email}</p>
              <p><strong>Role:</strong> {profile?.role}</p>
              <p><strong>Display Name:</strong> {profile?.display_name}</p>
            </div>
            
            <p className="text-gray-600 mb-4">
              The middleware is preventing direct access to protected pages. Click the button below to bypass the middleware and access your dashboard.
            </p>
            
            <button
              onClick={handleBypass}
              className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md"
            >
              {profile?.role === 'counselor' 
                ? 'Go to Counselor Dashboard' 
                : profile?.role === 'admin' 
                  ? 'Go to Admin Dashboard' 
                  : 'Go to Home'}
            </button>
          </div>
        )}
        
        <div className="mt-6 pt-4 border-t border-gray-100">
          <p className="text-sm text-gray-500 text-center">
            If you're not signed in, please <a href="/account/signin" className="text-blue-600 hover:text-blue-800">sign in</a> first.
          </p>
        </div>
      </div>
    </div>
  );
}
