"use client";
import React, { useState, useEffect } from "react";
import { useUser } from '@/utils/useUser';
import { supabase } from '@/utils/supabaseClient';
import Link from 'next/link';

export default function CheckRolePage() {
  const { data: user, loading: userLoading } = useUser();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [adminCheckResult, setAdminCheckResult] = useState(null);
  const [updateResult, setUpdateResult] = useState(null);
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

          // Also check admin status via API
          const adminResponse = await fetch("/api/admin/check-admin-status", {
            headers: {
              "Authorization": `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
            }
          });
          const adminData = await adminResponse.json();
          setAdminCheckResult(adminData);

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

  const makeAdmin = async () => {
    if (!user) return;

    try {
      setUpdating(true);
      setUpdateResult(null);

      // Update the user's role to admin directly
      const { data, error } = await supabase
        .from('user_profiles')
        .update({ role: 'admin' })
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
      setUpdateResult({
        success: true,
        message: 'Your role has been updated to admin'
      });

    } catch (err) {
      console.error("Error updating role:", err);
      setUpdateResult({
        success: false,
        message: err.message
      });
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
            Please sign in to check your admin status.
          </p>
          <Link
            href="/account/signin?redirect=/admin/check-role"
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
          <h1 className="text-2xl font-bold text-gray-800 mb-6">Admin Role Checker</h1>

          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg">
              <p className="font-medium">Error:</p>
              <p>{error}</p>
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
            <h2 className="text-lg font-semibold text-gray-700 mb-3">Profile Information</h2>
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
            <h2 className="text-lg font-semibold text-gray-700 mb-3">Admin Check API Result</h2>
            {adminCheckResult ? (
              <div className={`bg-gray-50 p-4 rounded-lg ${adminCheckResult.isAdmin ? 'text-green-700' : 'text-red-700'}`}>
                <p><span className="font-medium">Is Admin:</span> {adminCheckResult.isAdmin ? 'Yes' : 'No'}</p>
                {adminCheckResult.error && (
                  <p><span className="font-medium">Error:</span> {adminCheckResult.error}</p>
                )}
              </div>
            ) : (
              <p className="text-gray-500">No admin check result</p>
            )}
          </div>

          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-700 mb-3">Make Admin</h2>
            {profile?.role === 'admin' ? (
              <div className="bg-green-50 p-4 rounded-lg text-green-700">
                <p>You already have admin privileges.</p>
              </div>
            ) : (
              <div>
                <p className="mb-4 text-gray-600">
                  Click the button below to grant yourself admin privileges.
                </p>
                <button
                  onClick={makeAdmin}
                  disabled={updating}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {updating ? 'Updating...' : 'Make Me Admin'}
                </button>
              </div>
            )}

            {updateResult && (
              <div className={`mt-4 p-4 rounded-lg ${updateResult.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                <p>{updateResult.message}</p>
              </div>
            )}
          </div>

          <div className="flex justify-between">
            <Link
              href="/home"
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
