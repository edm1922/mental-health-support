"use client";
import React, { useState, useEffect } from "react";
import { useUser } from "@/utils/useUser";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { GlassCard } from "@/components/ui/ModernUI";

export default function EmotionInsightsPage() {
  const router = useRouter();
  const { data: user, loading: userLoading, profile } = useUser();
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userLoading && (!user || !profile || profile.role !== 'admin')) {
      router.push('/home');
    }
  }, [user, userLoading, profile, router]);

  useEffect(() => {
    if (user && profile?.role === 'admin') {
      fetchInsights();
    }
  }, [user, profile]);

  const fetchInsights = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/ai-assistant/insights');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch insights');
      }

      setInsights(data.insights);
    } catch (err) {
      console.error('Error fetching insights:', err);
      setError('Failed to load emotion insights. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  // Get color based on sentiment score
  const getSentimentColor = (score) => {
    if (score >= 0.5) return 'text-green-600';
    if (score >= 0) return 'text-blue-600';
    if (score >= -0.5) return 'text-orange-600';
    return 'text-red-600';
  };

  // Get emoji based on emotion
  const getEmotionEmoji = (emotion) => {
    switch (emotion) {
      case 'happy': return '😊';
      case 'sad': return '😔';
      case 'angry': return '😠';
      case 'anxious': return '😰';
      case 'confused': return '😕';
      case 'neutral': return '😌';
      default: return '❓';
    }
  };

  if (userLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
        <div className="max-w-7xl mx-auto">
          <GlassCard>
            <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
            <p className="text-gray-700">{error}</p>
            <button
              onClick={fetchInsights}
              className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
            >
              Try Again
            </button>
          </GlassCard>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Emotion AI Insights</h1>
          <Link
            href="/admin"
            className="bg-white text-gray-700 px-4 py-2 rounded-lg shadow-md hover:bg-gray-50 flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Admin Dashboard
          </Link>
        </div>

        {insights && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Overview Card */}
            <GlassCard>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Overview</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Conversations:</span>
                  <span className="font-semibold text-blue-600">{insights.totalConversations}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Users Engaged:</span>
                  <span className="font-semibold text-blue-600">{insights.totalUsers}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Average Sentiment:</span>
                  <span className={`font-semibold ${getSentimentColor(insights.averageSentiment)}`}>
                    {insights.averageSentiment}
                  </span>
                </div>
              </div>
            </GlassCard>

            {/* Emotion Distribution Card */}
            <GlassCard>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Emotion Distribution</h2>
              <div className="space-y-3">
                {Object.entries(insights.emotionDistribution).map(([emotion, count]) => (
                  <div key={emotion} className="flex items-center">
                    <span className="text-2xl mr-2">{getEmotionEmoji(emotion)}</span>
                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700 capitalize">{emotion}</span>
                        <span className="text-sm text-gray-500">{count} ({Math.round((count / insights.totalConversations) * 100)}%)</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${(count / insights.totalConversations) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>

            {/* Concerning Users Card */}
            <GlassCard>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Users Needing Support</h2>
              {insights.concerningUsers.length > 0 ? (
                <div className="space-y-4">
                  {insights.concerningUsers.map((user) => (
                    <div key={user.user_id} className="border-b border-gray-200 pb-3 last:border-0">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{user.user_profiles.display_name || 'Anonymous User'}</span>
                        <span className={`${getSentimentColor(user.avg_sentiment)}`}>
                          {parseFloat(user.avg_sentiment).toFixed(2)}
                        </span>
                      </div>
                      <Link
                        href={`/admin/user/${user.user_id}`}
                        className="text-sm text-blue-600 hover:underline"
                      >
                        View User Profile
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No concerning users detected</p>
              )}
            </GlassCard>

            {/* Recent Conversations Card */}
            <GlassCard className="md:col-span-2 lg:col-span-3">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Recent Conversations</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Message
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Emotion
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Sentiment
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {insights.recentConversations.map((conversation) => (
                      <tr key={conversation.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {conversation.user_profiles?.display_name || 'Anonymous User'}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 max-w-xs truncate">
                            {conversation.message}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <span className="text-xl mr-2">{getEmotionEmoji(conversation.emotion_detected)}</span>
                            <span className="text-sm text-gray-900 capitalize">{conversation.emotion_detected}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`text-sm font-medium ${getSentimentColor(conversation.sentiment_score)}`}>
                            {conversation.sentiment_score.toFixed(2)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(conversation.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </GlassCard>
          </div>
        )}
      </div>
    </div>
  );
}
