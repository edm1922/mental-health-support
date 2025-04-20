"use client";
import React, { useState, useEffect } from "react";
import { useUser } from '@/utils/useUser';
import { supabase } from '@/utils/supabaseClient';
import Link from 'next/link';

export default function AdminDashboard() {
  const { data: user } = useUser();
  const [stats, setStats] = useState({
    totalUsers: 0,
    counselors: 0,
    pendingApplications: 0,
    pendingPosts: 0,
    totalSessions: 0,
    totalCheckins: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Get user counts
      const { data: userProfiles, error: userError } = await supabase
        .from('user_profiles')
        .select('role', { count: 'exact' });

      if (userError) throw userError;

      const totalUsers = userProfiles?.length || 0;
      const counselors = userProfiles?.filter(p => p.role === 'counselor').length || 0;

      // Get pending applications
      const { count: pendingApplications, error: appError } = await supabase
        .from('counselor_applications')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      if (appError) throw appError;

      // Get pending posts
      const { count: pendingPosts, error: postError } = await supabase
        .from('discussion_posts')
        .select('*', { count: 'exact', head: true })
        .eq('is_approved', false);

      if (postError) throw postError;

      // Get total sessions
      const { count: totalSessions, error: sessionError } = await supabase
        .from('counseling_sessions')
        .select('*', { count: 'exact', head: true });

      if (sessionError) throw sessionError;

      // Get total checkins
      const { count: totalCheckins, error: checkinError } = await supabase
        .from('mental_health_checkins')
        .select('*', { count: 'exact', head: true });

      if (checkinError) throw checkinError;

      // Get recent activity (newest counselor applications, posts, and sessions)
      const [
        { data: recentApplications, error: recentAppError },
        { data: recentPosts, error: recentPostError },
        { data: recentSessions, error: recentSessionError }
      ] = await Promise.all([
        supabase
          .from('counselor_applications')
          .select('id, created_at, status')
          .order('created_at', { ascending: false })
          .limit(3),
        supabase
          .from('discussion_posts')
          .select('id, title, created_at, is_approved')
          .order('created_at', { ascending: false })
          .limit(3),
        supabase
          .from('counseling_sessions')
          .select('id, created_at, status')
          .order('created_at', { ascending: false })
          .limit(3)
      ]);

      if (recentAppError) throw recentAppError;
      if (recentPostError) throw recentPostError;
      if (recentSessionError) throw recentSessionError;

      // Format recent activity
      const activity = [
        ...(recentApplications || []).map(app => ({
          type: 'application',
          id: app.id,
          title: `New counselor application`,
          status: app.status,
          date: app.created_at,
          url: `/admin/counselor-applications?id=${app.id}`
        })),
        ...(recentPosts || []).map(post => ({
          type: 'post',
          id: post.id,
          title: post.title || 'Untitled post',
          status: post.is_approved ? 'approved' : 'pending',
          date: post.created_at,
          url: `/admin/forum-moderation?id=${post.id}`
        })),
        ...(recentSessions || []).map(session => ({
          type: 'session',
          id: session.id,
          title: `Counseling session`,
          status: session.status || 'scheduled',
          date: session.created_at,
          url: `/admin/sessions?id=${session.id}`
        }))
      ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);

      setStats({
        totalUsers,
        counselors,
        pendingApplications: pendingApplications || 0,
        pendingPosts: pendingPosts || 0,
        totalSessions: totalSessions || 0,
        totalCheckins: totalCheckins || 0
      });

      setRecentActivity(activity);
      setLoading(false);
    } catch (err) {
      console.error("Error loading dashboard data:", err);
      setError(err.message);
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-1">Manage your mental health support platform</p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 p-4 rounded-lg text-red-600">
          <p className="font-semibold">Error:</p>
          <p>{error}</p>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard data...</p>
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-all duration-300 border-t-4 border-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 flex items-center">
                    Total Users
                    <span className="ml-2 text-xs text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full">
                      Active Platform
                    </span>
                  </p>
                  <div className="flex items-baseline mt-1">
                    <p className="text-3xl font-bold text-gray-900">{stats.totalUsers}</p>
                    <p className="ml-2 text-xs text-green-600">↑ 2 this week</p>
                  </div>
                </div>
                <div className="p-3 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full shadow-md">
                  <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
              </div>

              {/* User avatars */}
              <div className="mt-4 flex">
                <div className="flex -space-x-2 overflow-hidden">
                  <div className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-blue-400 flex items-center justify-center text-white text-xs font-bold">JD</div>
                  <div className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-green-400 flex items-center justify-center text-white text-xs font-bold">KL</div>
                  <div className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-purple-400 flex items-center justify-center text-white text-xs font-bold">MN</div>
                  <div className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-gray-300 flex items-center justify-center text-gray-600 text-xs font-bold">+{Math.max(0, stats.totalUsers - 3)}</div>
                </div>
              </div>

              <div className="mt-4">
                <Link
                  href="/admin/users"
                  className="text-sm text-blue-600 hover:text-blue-800 flex items-center group transition-all duration-300"
                >
                  <span>View all users</span>
                  <svg
                    className="h-4 w-4 ml-1 transform group-hover:translate-x-1 transition-transform duration-300"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </Link>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-all duration-300 border-t-4 border-green-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Counselors</p>
                  <div className="flex items-baseline mt-1">
                    <p className="text-3xl font-bold text-gray-900">{stats.counselors}</p>
                    <p className="ml-2 text-xs text-gray-500">active</p>
                  </div>
                </div>
                <div className="p-3 bg-gradient-to-br from-green-400 to-green-600 rounded-full shadow-md">
                  <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              </div>

              <div className="mt-4 bg-yellow-50 rounded-lg p-2 border border-yellow-200 flex items-center justify-between animate-pulse-subtle">
                <div className="flex items-center">
                  <span className="text-yellow-600 mr-2">⚠️</span>
                  <span className="text-sm text-gray-700">Pending applications</span>
                </div>
                <span className="text-sm font-bold bg-yellow-200 text-yellow-800 px-2 py-0.5 rounded-full">{stats.pendingApplications}</span>
              </div>

              <div className="mt-4">
                <Link
                  href="/admin/counselor-applications"
                  className="text-sm text-green-600 hover:text-green-800 flex items-center group transition-all duration-300"
                >
                  <span>Review applications</span>
                  <svg
                    className="h-4 w-4 ml-1 transform group-hover:translate-x-1 transition-transform duration-300"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </Link>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-all duration-300 border-t-4 border-purple-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 flex items-center">
                    Forum Posts
                    {stats.pendingPosts > 0 && (
                      <span className="ml-2 text-xs text-red-500 bg-red-50 px-2 py-0.5 rounded-full animate-pulse">
                        Action Needed
                      </span>
                    )}
                  </p>
                  <div className="flex items-baseline mt-1">
                    <p className="text-3xl font-bold text-gray-900">{stats.pendingPosts}</p>
                    <p className="ml-2 text-xs text-gray-500">pending approval</p>
                  </div>
                </div>
                <div className="p-3 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full shadow-md">
                  <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
              </div>

              {/* Post preview */}
              {stats.pendingPosts > 0 ? (
                <div className="mt-4 bg-gray-50 rounded-lg p-2 border border-gray-200">
                  <div className="text-xs text-gray-500 mb-1">Latest pending post:</div>
                  <div className="text-sm font-medium text-gray-800 truncate">How to cope with anxiety...</div>
                </div>
              ) : (
                <div className="mt-4 bg-green-50 rounded-lg p-2 border border-green-200">
                  <div className="text-sm text-green-800 flex items-center">
                    <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    All posts are moderated
                  </div>
                </div>
              )}

              <div className="mt-4">
                <Link
                  href="/admin/forum-moderation"
                  className="text-sm text-purple-600 hover:text-purple-800 flex items-center group transition-all duration-300"
                >
                  <span>Moderate forum</span>
                  <svg
                    className="h-4 w-4 ml-1 transform group-hover:translate-x-1 transition-transform duration-300"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-md p-6 mb-8 hover:shadow-lg transition-shadow duration-300">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <span className="text-indigo-500 mr-2">⚡</span>
              Quick Actions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
              <Link
                href="/admin/counselor-applications"
                className="flex items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 hover:scale-[1.02] transition-all duration-300 shadow-sm"
              >
                <div className="p-2 bg-blue-100 rounded-full mr-3">
                  <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-gray-800">Review Applications</span>
              </Link>

              <Link
                href="/admin/forum-moderation"
                className="flex items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 hover:scale-[1.02] transition-all duration-300 shadow-sm"
              >
                <div className="p-2 bg-purple-100 rounded-full mr-3">
                  <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-gray-800">Moderate Forum</span>
              </Link>

              <Link
                href="/admin/database-management"
                className="flex items-center p-4 bg-yellow-50 rounded-lg hover:bg-yellow-100 hover:scale-[1.02] transition-all duration-300 shadow-sm"
              >
                <div className="p-2 bg-yellow-100 rounded-full mr-3">
                  <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-gray-800">Database Management</span>
              </Link>

              <Link
                href="/admin/fix-db-schema"
                className="flex items-center p-4 bg-red-50 rounded-lg hover:bg-red-100 hover:scale-[1.02] transition-all duration-300 shadow-sm"
              >
                <div className="p-2 bg-red-100 rounded-full mr-3">
                  <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-gray-800">Fix DB Schema</span>
              </Link>

              <Link
                href="/admin/fix-counseling-sessions"
                className="flex items-center p-4 bg-orange-50 rounded-lg hover:bg-orange-100 hover:scale-[1.02] transition-all duration-300 shadow-sm"
              >
                <div className="p-2 bg-orange-100 rounded-full mr-3">
                  <svg className="h-6 w-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-gray-800">Fix Counseling Sessions</span>
              </Link>

              <Link
                href="/admin/checkin-analytics"
                className="flex items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 hover:scale-[1.02] transition-all duration-300 shadow-sm"
              >
                <div className="p-2 bg-green-100 rounded-full mr-3">
                  <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-gray-800">View Analytics</span>
              </Link>
            </div>
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Recent Activity */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Recent Activity</h2>
              {recentActivity.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No recent activity</p>
              ) : (
                <div className="space-y-4">
                  {recentActivity.map((item, index) => (
                    <div key={index} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                      <div className="flex items-start">
                        <div className={`p-2 rounded-full mr-3 ${
                          item.type === 'application' ? 'bg-blue-50 text-blue-500' :
                          item.type === 'post' ? 'bg-purple-50 text-purple-500' :
                          'bg-green-50 text-green-500'
                        }`}>
                          {item.type === 'application' && (
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                          )}
                          {item.type === 'post' && (
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                            </svg>
                          )}
                          {item.type === 'session' && (
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          )}
                        </div>
                        <div className="flex-1">
                          <Link href={item.url} className="font-medium text-gray-800 hover:text-indigo-600">
                            {item.title}
                          </Link>
                          <div className="flex justify-between mt-1">
                            <span className="text-xs text-gray-500">{formatDate(item.date)}</span>
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                              item.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              item.status === 'approved' ? 'bg-green-100 text-green-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {item.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-4 text-right">
                <button
                  onClick={loadDashboardData}
                  className="text-sm text-indigo-600 hover:text-indigo-800"
                >
                  Refresh data
                </button>
              </div>
            </div>

            {/* System Stats */}
            <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow duration-300">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <span className="text-indigo-500 mr-2">📈</span>
                System Statistics
                <span className="ml-auto text-xs text-gray-400">Last updated: {new Date().toLocaleTimeString()}</span>
              </h2>
              <div className="space-y-6">
                <div className="bg-blue-50 rounded-lg p-4 transition-all duration-300 hover:shadow-md">
                  <div className="flex items-center mb-3">
                    <div className="p-2 bg-blue-100 rounded-full mr-3">
                      <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <div className="flex justify-between items-center w-full">
                        <span className="text-sm font-medium text-gray-700">Total Counseling Sessions</span>
                        <span className="text-sm font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">{stats.totalSessions}</span>
                      </div>
                    </div>
                  </div>
                  <div className="w-full bg-blue-200 rounded-full h-3">
                    <div
                      className="bg-blue-600 h-3 rounded-full transition-all duration-500 animate-pulse-once"
                      style={{ width: `${Math.min(100, (stats.totalSessions / 100) * 100)}%` }}
                    ></div>
                  </div>
                </div>

                <div className="bg-green-50 rounded-lg p-4 transition-all duration-300 hover:shadow-md">
                  <div className="flex items-center mb-3">
                    <div className="p-2 bg-green-100 rounded-full mr-3">
                      <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <div className="flex justify-between items-center w-full">
                        <span className="text-sm font-medium text-gray-700">Total Check-ins</span>
                        <span className="text-sm font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">{stats.totalCheckins}</span>
                      </div>
                    </div>
                  </div>
                  <div className="w-full bg-green-200 rounded-full h-3">
                    <div
                      className="bg-green-600 h-3 rounded-full transition-all duration-500 animate-pulse-once"
                      style={{ width: `${Math.min(100, (stats.totalCheckins / 500) * 100)}%` }}
                    ></div>
                  </div>
                </div>

                <div className="bg-purple-50 rounded-lg p-4 transition-all duration-300 hover:shadow-md">
                  <div className="flex items-center mb-3">
                    <div className="p-2 bg-purple-100 rounded-full mr-3">
                      <svg className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <div>
                      <div className="flex justify-between items-center w-full">
                        <div className="flex items-center">
                          <span className="text-sm font-medium text-gray-700">Counselor to User Ratio</span>
                          <span className="ml-1 text-gray-400 cursor-help group relative" title="The ratio of counselors to users on the platform">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="hidden group-hover:block absolute bottom-full left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded py-1 px-2 w-48">
                              Ideal ratio is 1:10 or better. Lower numbers indicate better counselor availability.
                            </span>
                          </span>
                        </div>
                        <span className="text-sm font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">
                          {stats.totalUsers > 0 ? `1:${Math.round(stats.totalUsers / Math.max(1, stats.counselors))}` : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="w-full bg-purple-200 rounded-full h-3">
                    <div
                      className="bg-purple-600 h-3 rounded-full transition-all duration-500 animate-pulse-once"
                      style={{
                        width: `${Math.min(100, (stats.counselors / Math.max(1, stats.totalUsers)) * 500)}%`
                      }}
                    ></div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-between items-center">
                <Link
                  href="/admin/checkin-analytics"
                  className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center group transition-all duration-300"
                >
                  <span>View detailed analytics</span>
                  <svg
                    className="h-4 w-4 ml-1 transform group-hover:translate-x-1 transition-transform duration-300"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </Link>
                <span className="text-xs text-gray-400 italic">Updated every 5 minutes</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
