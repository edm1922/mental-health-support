"use client";
import React, { useState, useEffect } from "react";
import { useUser } from '@/utils/useUser';
import { supabase } from '@/utils/supabaseClient';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export default function UserDetailsPage() {
  const { data: user } = useUser();
  const searchParams = useSearchParams();
  const userId = searchParams.get('id');
  
  const [userDetails, setUserDetails] = useState(null);
  const [checkins, setCheckins] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    if (user) {
      checkAdminStatus();
      if (userId) {
        loadUserDetails();
      }
    }
  }, [user, userId]);

  const checkAdminStatus = async () => {
    try {
      const { data: profile, error } = await supabase
        .from("user_profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      setIsAdmin(profile?.role === "admin");
    } catch (err) {
      console.error("Error checking admin status:", err);
      setError("Failed to verify admin status");
    }
  };

  const loadUserDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) throw profileError;
      setUserDetails(profile);

      // Get user's check-ins
      const { data: userCheckins, error: checkinsError } = await supabase
        .from('mental_health_checkins')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (checkinsError) throw checkinsError;
      setCheckins(userCheckins || []);

      // Get user's counseling sessions
      const { data: userSessions, error: sessionsError } = await supabase
        .from('counseling_sessions')
        .select('*')
        .or(`patient_id.eq.${userId},counselor_id.eq.${userId}`)
        .order('created_at', { ascending: false })
        .limit(10);

      if (sessionsError) throw sessionsError;
      setSessions(userSessions || []);

    } catch (err) {
      console.error("Error loading user details:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const getMoodEmoji = (mood) => {
    const emojis = ['😢', '😕', '😐', '🙂', '😄'];
    return emojis[mood - 1] || '❓';
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
            <p className="text-gray-700 mb-6">
              You don't have permission to access this page. This area is restricted to administrators only.
            </p>
            <Link
              href="/admin"
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Admin Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">User Details</h1>
          <div className="flex space-x-4">
            <Link
              href="/admin/users"
              className="bg-white text-gray-600 px-4 py-2 rounded-lg shadow-md hover:bg-gray-50 flex items-center gap-2"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Users
            </Link>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 p-4 rounded-lg text-red-600 border border-red-200">
            <p className="font-semibold">Error:</p>
            <p>{error}</p>
          </div>
        )}

        {loading ? (
          <div className="bg-white rounded-xl shadow-lg p-12 flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
          </div>
        ) : userDetails ? (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="p-6 bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
              <div className="flex items-center">
                <div className="h-20 w-20 rounded-full bg-white flex items-center justify-center text-indigo-600 text-3xl font-bold mr-6">
                  {userDetails.display_name ? userDetails.display_name.charAt(0).toUpperCase() : '?'}
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{userDetails.display_name || 'Unnamed User'}</h2>
                  <p className="text-indigo-100">{userDetails.email || 'No email'}</p>
                  <div className="mt-2">
                    <span className="px-3 py-1 bg-white bg-opacity-20 rounded-full text-sm font-medium">
                      {userDetails.role || 'user'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-b border-gray-200">
              <nav className="flex -mb-px">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`py-4 px-6 text-sm font-medium ${
                    activeTab === 'profile'
                      ? 'border-b-2 border-indigo-500 text-indigo-600'
                      : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Profile
                </button>
                <button
                  onClick={() => setActiveTab('checkins')}
                  className={`py-4 px-6 text-sm font-medium ${
                    activeTab === 'checkins'
                      ? 'border-b-2 border-indigo-500 text-indigo-600'
                      : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Check-ins ({checkins.length})
                </button>
                <button
                  onClick={() => setActiveTab('sessions')}
                  className={`py-4 px-6 text-sm font-medium ${
                    activeTab === 'sessions'
                      ? 'border-b-2 border-indigo-500 text-indigo-600'
                      : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Sessions ({sessions.length})
                </button>
              </nav>
            </div>

            <div className="p-6">
              {activeTab === 'profile' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">User Information</h3>
                    <div className="bg-gray-50 rounded-lg p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">User ID</p>
                        <p className="font-mono text-xs mt-1 break-all">{userDetails.id}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Email</p>
                        <p className="mt-1">{userDetails.email || 'Not provided'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Display Name</p>
                        <p className="mt-1">{userDetails.display_name || 'Not set'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Role</p>
                        <p className="mt-1 capitalize">{userDetails.role || 'user'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Created At</p>
                        <p className="mt-1">{formatDate(userDetails.created_at)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Last Updated</p>
                        <p className="mt-1">{formatDate(userDetails.updated_at)}</p>
                      </div>
                    </div>
                  </div>

                  {userDetails.role === 'counselor' && (
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Counselor Information</h3>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-gray-500">Specialization</p>
                            <p className="mt-1">{userDetails.specialization || 'Not specified'}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Experience</p>
                            <p className="mt-1">{userDetails.experience || 'Not specified'}</p>
                          </div>
                        </div>
                        <div className="mt-4">
                          <p className="text-sm text-gray-500">Bio</p>
                          <p className="mt-1">{userDetails.bio || 'No bio provided'}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Actions</h3>
                    <div className="flex flex-wrap gap-3">
                      <Link
                        href={`/admin/set-role?id=${userDetails.id}`}
                        className="inline-flex items-center px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200"
                      >
                        <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                        Change Role
                      </Link>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'checkins' && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Check-ins</h3>
                  {checkins.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                      <svg className="h-12 w-12 text-gray-400 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="text-gray-500">No check-ins found for this user</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {checkins.map((checkin) => (
                        <div key={checkin.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex justify-between items-center mb-2">
                            <div>
                              <p className="text-sm text-gray-500">{formatDate(checkin.created_at)}</p>
                            </div>
                            <div className="text-2xl">{getMoodEmoji(checkin.mood)}</div>
                          </div>
                          <div className="bg-gray-50 p-3 rounded-lg mt-2">
                            <p className="text-gray-700">{checkin.notes || 'No notes provided'}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'sessions' && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Counseling Sessions</h3>
                  {sessions.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                      <svg className="h-12 w-12 text-gray-400 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-gray-500">No counseling sessions found for this user</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {sessions.map((session) => (
                        <div key={session.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-medium">
                                {session.patient_id === userId ? 'As Patient' : 'As Counselor'}
                              </p>
                              <p className="text-sm text-gray-500">
                                {session.scheduled_time ? formatDate(session.scheduled_time) : 'No scheduled time'}
                              </p>
                            </div>
                            <div>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                session.status === 'completed' ? 'bg-green-100 text-green-800' :
                                session.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                                'bg-yellow-100 text-yellow-800'
                              }`}>
                                {session.status || 'pending'}
                              </span>
                            </div>
                          </div>
                          <div className="mt-2 flex justify-end">
                            <Link
                              href={`/admin/session-details?id=${session.id}`}
                              className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded-lg"
                            >
                              View Details
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <p className="text-gray-700">User not found or ID not provided.</p>
            <Link
              href="/admin/users"
              className="mt-4 inline-flex items-center text-indigo-600 hover:text-indigo-800"
            >
              <svg className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Users
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
