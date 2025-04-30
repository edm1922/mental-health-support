"use client";
import React from 'react';
import { motion } from 'framer-motion';

export default function UserStats({ stats = {} }) {
  // Default stats if none provided
  const {
    currentStreak = 0,
    longestStreak = 0,
    totalCheckins = 0,
    lastCheckin = null,
    sessionsCompleted = 0,
    communityPosts = 0
  } = stats;
  
  // Format date for last check-in
  const formatLastCheckin = () => {
    if (!lastCheckin) return "No check-ins yet";
    
    const date = new Date(lastCheckin);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString();
    }
  };
  
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Activity</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Check-in Stats */}
        <motion.div 
          className="bg-blue-50 rounded-lg p-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h3 className="text-sm font-medium text-blue-700 mb-3">Check-in Streak</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold text-gray-900">{currentStreak}</p>
              <p className="text-sm text-gray-500">Current streak</p>
            </div>
            <div className="text-right">
              <p className="text-xl font-semibold text-gray-700">{longestStreak}</p>
              <p className="text-sm text-gray-500">Longest streak</p>
            </div>
          </div>
          
          {/* Streak visualization */}
          <div className="mt-3">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-gray-500">Last check-in: {formatLastCheckin()}</span>
              <span className="text-xs text-gray-500">{totalCheckins} total</span>
            </div>
            <div className="h-2 bg-blue-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 rounded-full" 
                style={{ width: `${Math.min(100, (currentStreak / Math.max(longestStreak, 7)) * 100)}%` }}
              ></div>
            </div>
          </div>
        </motion.div>
        
        {/* Sessions Stats */}
        <motion.div 
          className="bg-purple-50 rounded-lg p-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <h3 className="text-sm font-medium text-purple-700 mb-3">Counseling Sessions</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold text-gray-900">{sessionsCompleted}</p>
              <p className="text-sm text-gray-500">Sessions completed</p>
            </div>
            <div className="h-16 w-16 rounded-full bg-purple-100 flex items-center justify-center">
              <svg className="h-8 w-8 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
          
          {/* Next session reminder placeholder */}
          <div className="mt-3 text-sm text-gray-600">
            {sessionsCompleted > 0 ? (
              <p>Keep up the great work!</p>
            ) : (
              <p>Book your first session to get started</p>
            )}
          </div>
        </motion.div>
        
        {/* Community Stats */}
        <motion.div 
          className="bg-green-50 rounded-lg p-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <h3 className="text-sm font-medium text-green-700 mb-3">Community Engagement</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold text-gray-900">{communityPosts}</p>
              <p className="text-sm text-gray-500">Community posts</p>
            </div>
            <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
              <svg className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
              </svg>
            </div>
          </div>
          
          {/* Community engagement message */}
          <div className="mt-3 text-sm text-gray-600">
            {communityPosts > 0 ? (
              <p>You're an active community member!</p>
            ) : (
              <p>Join the conversation in our community</p>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
