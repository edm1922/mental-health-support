"use client";
import React, { useState, useEffect } from "react";
import { useUser } from "@/utils/useUser";
import { supabase } from "@/utils/supabaseClient";
import Link from "next/link";

export default function CreateCounselorPage() {
  const { data: user, loading: userLoading } = useUser();
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    if (user) {
      loadUsers();
    }
  }, [user]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get all users
      const { data: userData, error: userError } = await supabase
        .from('user_profiles')
        .select('id, display_name, role')
        .order('display_name', { ascending: true });

      if (userError) throw userError;
      setUsers(userData || []);

    } catch (err) {
      console.error("Error loading users:", err);
      setError("Failed to load users: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const makeCounselor = async (e) => {
    e.preventDefault();
    
    if (!selectedUser) {
      setError("Please select a user");
      return;
    }

    try {
      setCreating(true);
      setError(null);
      setSuccess(null);

      // Update the user's role to counselor
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({
          role: 'counselor',
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedUser);

      if (updateError) throw updateError;

      setSuccess("User has been made a counselor successfully!");
      
      // Refresh the user list
      await loadUsers();
      
      // Reset form
      setSelectedUser("");
      
    } catch (err) {
      console.error("Error making counselor:", err);
      setError("Failed to make counselor: " + err.message);
    } finally {
      setCreating(false);
    }
  };

  if (userLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-xl p-8 max-w-md w-full">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Authentication Required</h1>
          <p className="text-gray-600 mb-6">Please sign in to access this page.</p>
          <Link href="/account/signin" className="block w-full bg-indigo-600 text-white text-center py-2 px-4 rounded-lg hover:bg-indigo-700">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
      <div className="max-w-3xl mx-auto">
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

        <div className="bg-white rounded-xl shadow-xl p-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">Create Counselor</h1>
          
          {error && (
            <div className="mb-6 bg-red-50 p-4 rounded-lg text-red-600">
              {error}
            </div>
          )}
          
          {success && (
            <div className="mb-6 bg-green-50 p-4 rounded-lg text-green-600">
              {success}
            </div>
          )}

          <form onSubmit={makeCounselor}>
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="user">
                Select User
              </label>
              <select
                id="user"
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                disabled={loading || creating}
              >
                <option value="">Select a user</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.display_name || "Unnamed User"} {user.role === 'counselor' ? '(Already Counselor)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-between">
              <button
                type="submit"
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                disabled={loading || creating}
              >
                {creating ? "Making Counselor..." : "Make Counselor"}
              </button>
              
              <div className="flex space-x-2">
                <Link
                  href="/admin/create-test-session"
                  className="inline-block align-baseline font-bold text-sm text-blue-500 hover:text-blue-800"
                >
                  Create Test Session
                </Link>
                <Link
                  href="/admin/view-all-sessions"
                  className="inline-block align-baseline font-bold text-sm text-blue-500 hover:text-blue-800"
                >
                  View All Sessions
                </Link>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
