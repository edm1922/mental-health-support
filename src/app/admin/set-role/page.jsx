"use client";
import React, { useState, useEffect } from "react";
import { useUser } from '@/utils/useUser';
import { supabase } from '@/utils/supabaseClient';
import Link from 'next/link';

export default function SetRolePage() {
  const { data: user, loading: userLoading } = useUser();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      if (user) {
        try {
          setLoading(true);
          
          // Get the user's profile directly from Supabase
          const { data: profileData, error: profileError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', user.id)
            .single();
            
          if (profileError) {
            throw new Error(`Failed to fetch profile: ${profileError.message}`);
          }
          
          setProfile(profileData);
          
        } catch (err) {
          console.error("Error loading profile:", err);
          setError(err.message);
        } finally {
          setLoading(false);
        }
      }
    }
    
    loadProfile();
  }, [user]);
  
  const setRole = async (role) => {
    if (!user) return;
    
    try {
      setUpdating(true);
      setSuccess(null);
      setError(null);
      
      // Update the user's role directly
      const { data, error } = await supabase
        .from('user_profiles')
        .update({ role })
        .eq('id', user.id);
        
      if (error) {
        throw new Error(`Failed to update role: ${error.message}`);
      }
      
      // Refresh the profile
      const { data: updatedProfile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();
        
      if (profileError) {
        throw new Error(`Failed to fetch updated profile: ${profileError.message}`);
      }
      
      setProfile(updatedProfile);
      setSuccess(`Your role has been updated to ${role}`);
      
    } catch (err) {
      console.error("Error updating role:", err);
      setError(err.message);
    } finally {
      setUpdating(false);
    }
  };

  if (userLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md w-full">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            Authentication Required
          </h1>
          <p className="text-gray-600 mb-6">
            Please sign in to manage your role.
          </p>
          <Link
            href="/account/signin?redirect=/admin/set-role"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-xl shadow-xl p-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">User Role Manager</h1>
          
          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg">
              <p className="font-medium">Error:</p>
              <p>{error}</p>
            </div>
          )}
          
          {success && (
            <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-lg">
              <p className="font-medium">Success:</p>
              <p>{success}</p>
            </div>
          )}
          
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-700 mb-3">User Information</h2>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p><span className="font-medium">User ID:</span> {user.id}</p>
              <p><span className="font-medium">Email:</span> {user.email}</p>
            </div>
          </div>
          
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-700 mb-3">Current Profile</h2>
            {profile ? (
              <div className="bg-gray-50 p-4 rounded-lg">
                <p><span className="font-medium">Display Name:</span> {profile.display_name}</p>
                <p><span className="font-medium">Role:</span> {profile.role || 'No role set'}</p>
                <p><span className="font-medium">Created At:</span> {new Date(profile.created_at).toLocaleString()}</p>
                <p><span className="font-medium">Updated At:</span> {new Date(profile.updated_at).toLocaleString()}</p>
              </div>
            ) : (
              <p className="text-gray-500">No profile found</p>
            )}
          </div>
          
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-700 mb-3">Set Role</h2>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setRole('admin')}
                disabled={updating || profile?.role === 'admin'}
                className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50"
              >
                {updating ? 'Updating...' : 'Set as Admin'}
              </button>
              
              <button
                onClick={() => setRole('counselor')}
                disabled={updating || profile?.role === 'counselor'}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {updating ? 'Updating...' : 'Set as Counselor'}
              </button>
              
              <button
                onClick={() => setRole('user')}
                disabled={updating || profile?.role === 'user'}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {updating ? 'Updating...' : 'Set as Regular User'}
              </button>
            </div>
          </div>
          
          <div className="flex justify-between">
            <Link
              href="/"
              className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300"
            >
              Back to Home
            </Link>
            
            {profile?.role === 'admin' && (
              <Link
                href="/admin/dashboard"
                className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700"
              >
                Go to Admin Dashboard
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
