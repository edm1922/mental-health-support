"use client";
import React, { useState, useEffect } from "react";
import { useUser } from "@/utils/useUser";
import { supabase } from "@/utils/supabaseClient";
import Link from "next/link";

export default function CheckinAnalyticsPage() {
  const { data: user, loading: userLoading } = useUser();
  const [analytics, setAnalytics] = useState({
    totalCheckins: 0,
    averageMood: 0,
    moodDistribution: [0, 0, 0, 0, 0],
    recentTrend: [],
    userEngagement: 0,
    concerningUsers: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState("week"); // "week", "month", "all"

  useEffect(() => {
    if (user) {
      checkAdminStatus();
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadAnalytics();
    }
  }, [user, dateRange]);

  const checkAdminStatus = async () => {
    try {
      // Get the current auth token
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        throw new Error('Authentication required');
      }

      // Check if the user is an admin
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profileError) {
        throw new Error('Failed to fetch user profile');
      }

      if (profile.role !== 'admin') {
        throw new Error('Only administrators can access this page');
      }
    } catch (err) {
      console.error("Error checking admin status:", err);
      setError(err.message || "Failed to verify admin status");
    }
  };

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get the current auth token
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        throw new Error('Authentication required');
      }

      // Calculate date range filter
      let dateFilter = null;
      const now = new Date();
      
      if (dateRange === "week") {
        const weekAgo = new Date();
        weekAgo.setDate(now.getDate() - 7);
        dateFilter = weekAgo.toISOString();
      } else if (dateRange === "month") {
        const monthAgo = new Date();
        monthAgo.setMonth(now.getMonth() - 1);
        dateFilter = monthAgo.toISOString();
      }

      // Get total check-ins
      let query = supabase
        .from('mental_health_checkins')
        .select('id', { count: 'exact' });

      // Add date filter if needed
      if (dateFilter) {
        query = query.gte('created_at', dateFilter);
      }

      const { count: totalCheckins, error: countError } = await query;

      if (countError) {
        throw new Error('Failed to fetch check-in count');
      }

      // Get mood distribution and calculate average
      let moodQuery = supabase
        .from('mental_health_checkins')
        .select('mood_rating');

      // Add date filter if needed
      if (dateFilter) {
        moodQuery = moodQuery.gte('created_at', dateFilter);
      }

      const { data: moodData, error: moodError } = await moodQuery;

      if (moodError) {
        throw new Error('Failed to fetch mood data');
      }

      // Calculate mood distribution
      const moodDistribution = [0, 0, 0, 0, 0];
      let moodSum = 0;

      moodData.forEach(checkin => {
        const rating = checkin.mood_rating;
        if (rating >= 1 && rating <= 5) {
          moodDistribution[rating - 1]++;
          moodSum += rating;
        }
      });

      const averageMood = moodData.length > 0 ? (moodSum / moodData.length).toFixed(1) : 0;

      // Get recent trend (daily average for the last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(now.getDate() - 7);

      const { data: recentData, error: recentError } = await supabase
        .from('mental_health_checkins')
        .select('mood_rating, created_at')
        .gte('created_at', sevenDaysAgo.toISOString())
        .order('created_at', { ascending: true });

      if (recentError) {
        throw new Error('Failed to fetch recent trend data');
      }

      // Group by day and calculate average
      const dailyAverages = {};
      
      recentData.forEach(checkin => {
        const day = new Date(checkin.created_at).toLocaleDateString();
        if (!dailyAverages[day]) {
          dailyAverages[day] = { sum: 0, count: 0 };
        }
        dailyAverages[day].sum += checkin.mood_rating;
        dailyAverages[day].count++;
      });

      const recentTrend = Object.entries(dailyAverages).map(([day, data]) => ({
        day,
        average: (data.sum / data.count).toFixed(1)
      }));

      // Get user engagement (percentage of users who have checked in)
      const { data: totalUsers, error: usersError } = await supabase
        .from('user_profiles')
        .select('id', { count: 'exact' });

      if (usersError) {
        throw new Error('Failed to fetch user count');
      }

      // Get unique users who have checked in
      let uniqueUsersQuery = supabase
        .from('mental_health_checkins')
        .select('user_id', { count: 'exact', distinct: true });

      // Add date filter if needed
      if (dateFilter) {
        uniqueUsersQuery = uniqueUsersQuery.gte('created_at', dateFilter);
      }

      const { count: activeUsers, error: activeError } = await uniqueUsersQuery;

      if (activeError) {
        throw new Error('Failed to fetch active user count');
      }

      const userEngagement = totalUsers > 0 ? ((activeUsers / totalUsers) * 100).toFixed(1) : 0;

      // Find concerning users (users with consistently low mood ratings)
      const { data: lowMoodUsers, error: lowMoodError } = await supabase
        .from('mental_health_checkins')
        .select('user_id, mood_rating')
        .lte('mood_rating', 2) // Ratings of 1 or 2 are concerning
        .gte('created_at', sevenDaysAgo.toISOString());

      if (lowMoodError) {
        throw new Error('Failed to fetch concerning users');
      }

      // Group by user and count low mood check-ins
      const userCounts = {};
      lowMoodUsers.forEach(checkin => {
        if (!userCounts[checkin.user_id]) {
          userCounts[checkin.user_id] = 0;
        }
        userCounts[checkin.user_id]++;
      });

      // Filter users with multiple low mood check-ins
      const concerningUserIds = Object.entries(userCounts)
        .filter(([_, count]) => count >= 2) // At least 2 low mood check-ins
        .map(([userId, _]) => userId);

      // Get user profiles for concerning users
      let concerningUsers = [];
      
      if (concerningUserIds.length > 0) {
        const { data: userProfiles, error: profilesError } = await supabase
          .from('user_profiles')
          .select('id, display_name')
          .in('id', concerningUserIds);

        if (!profilesError) {
          concerningUsers = userProfiles;
        }
      }

      // Update analytics state
      setAnalytics({
        totalCheckins,
        averageMood,
        moodDistribution,
        recentTrend,
        userEngagement,
        concerningUsers
      });
    } catch (err) {
      console.error("Error loading analytics:", err);
      setError(err.message || "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  const getMoodEmoji = (rating) => {
    const emojis = ["😢", "😕", "😐", "🙂", "😊"];
    return emojis[Math.min(Math.max(0, Math.round(rating) - 1), 4)];
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
      <div className="max-w-7xl mx-auto">
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

          <Link
            href="/admin/dashboard"
            className="rounded-lg bg-[#357AFF] px-4 py-2 text-white hover:bg-[#2E69DE]"
          >
            Admin Dashboard
          </Link>
        </div>

        <h1 className="text-3xl font-bold text-gray-800 mb-6">Check-in Analytics</h1>

        {error && (
          <div className="mb-6 bg-red-50 p-4 rounded-lg text-red-600">
            {error}
          </div>
        )}

        <div className="mb-6 flex justify-end space-x-2">
          <button
            onClick={() => setDateRange("week")}
            className={`px-4 py-2 rounded-lg text-sm ${
              dateRange === "week"
                ? "bg-indigo-600 text-white"
                : "bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            Last Week
          </button>
          <button
            onClick={() => setDateRange("month")}
            className={`px-4 py-2 rounded-lg text-sm ${
              dateRange === "month"
                ? "bg-indigo-600 text-white"
                : "bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            Last Month
          </button>
          <button
            onClick={() => setDateRange("all")}
            className={`px-4 py-2 rounded-lg text-sm ${
              dateRange === "all"
                ? "bg-indigo-600 text-white"
                : "bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            All Time
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading analytics...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Total Check-ins Card */}
            <div className="bg-white rounded-xl shadow-xl p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Total Check-ins</h2>
              <div className="flex items-center">
                <div className="text-4xl font-bold text-indigo-600">{analytics.totalCheckins}</div>
                <div className="ml-4 text-gray-500">
                  {dateRange === "week" ? "in the last week" : 
                   dateRange === "month" ? "in the last month" : 
                   "all time"}
                </div>
              </div>
            </div>

            {/* Average Mood Card */}
            <div className="bg-white rounded-xl shadow-xl p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Average Mood</h2>
              <div className="flex items-center">
                <div className="text-4xl font-bold text-indigo-600">{analytics.averageMood}</div>
                <div className="ml-4 text-5xl">{getMoodEmoji(analytics.averageMood)}</div>
              </div>
              <div className="mt-2 text-sm text-gray-500">
                out of 5.0 average rating
              </div>
            </div>

            {/* User Engagement Card */}
            <div className="bg-white rounded-xl shadow-xl p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-2">User Engagement</h2>
              <div className="flex items-center">
                <div className="text-4xl font-bold text-indigo-600">{analytics.userEngagement}%</div>
                <div className="ml-4 text-gray-500">
                  of users have checked in
                </div>
              </div>
            </div>

            {/* Mood Distribution Card */}
            <div className="bg-white rounded-xl shadow-xl p-6 lg:col-span-2">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Mood Distribution</h2>
              <div className="flex items-end h-48 space-x-4">
                {analytics.moodDistribution.map((count, index) => {
                  const percentage = analytics.totalCheckins > 0 
                    ? (count / analytics.totalCheckins) * 100 
                    : 0;
                  
                  return (
                    <div key={index} className="flex-1 flex flex-col items-center">
                      <div className="text-sm font-medium mb-1">{count}</div>
                      <div 
                        className={`w-full rounded-t-lg ${
                          index === 0 ? "bg-red-400" :
                          index === 1 ? "bg-orange-400" :
                          index === 2 ? "bg-yellow-400" :
                          index === 3 ? "bg-green-400" :
                          "bg-emerald-400"
                        }`}
                        style={{ height: `${Math.max(5, percentage)}%` }}
                      ></div>
                      <div className="text-2xl mt-2">{getMoodEmoji(index + 1)}</div>
                      <div className="text-xs text-gray-500 mt-1">{Math.round(percentage)}%</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Concerning Users Card */}
            <div className="bg-white rounded-xl shadow-xl p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Users Needing Support</h2>
              {analytics.concerningUsers.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-gray-500">No users with concerning patterns</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {analytics.concerningUsers.map((user) => (
                    <div key={user.id} className="p-3 bg-red-50 rounded-lg border-l-4 border-red-500">
                      <div className="flex items-center">
                        <div className="mr-3 text-xl">⚠️</div>
                        <div>
                          <h3 className="font-medium text-gray-800">{user.display_name || "Anonymous"}</h3>
                          <p className="text-sm text-red-600">Multiple low mood check-ins</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
