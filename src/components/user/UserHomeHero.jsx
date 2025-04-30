"use client";
import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function UserHomeHero({ userName, userRole }) {
  // Get time of day for personalized greeting
  const getTimeOfDay = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "morning";
    if (hour < 18) return "afternoon";
    return "evening";
  };

  // Get greeting based on user role
  const getGreeting = () => {
    const timeOfDay = getTimeOfDay();
    const greeting = `Good ${timeOfDay}`;
    
    if (!userName) return greeting;
    return `${greeting}, ${userName}`;
  };

  // Get subtitle based on user role
  const getSubtitle = () => {
    switch(userRole) {
      case 'counselor':
        return "Your clients are waiting for your guidance. What would you like to do today?";
      case 'admin':
        return "Welcome to your admin dashboard. Monitor and manage the platform effectively.";
      default:
        return "How are you feeling today? Take a moment to check in with yourself.";
    }
  };

  return (
    <div className="relative bg-gradient-to-br from-blue-600 to-indigo-800 text-white overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <svg className="h-full w-full" viewBox="0 0 800 800" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
              <path d="M 50 0 L 0 0 0 50" fill="none" stroke="white" strokeWidth="1" opacity="0.3" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>
      
      {/* Decorative circles */}
      <div className="absolute top-0 right-0 -mt-24 -mr-24 h-64 w-64 rounded-full bg-blue-500 opacity-20 blur-3xl"></div>
      <div className="absolute bottom-0 left-0 -mb-24 -ml-24 h-64 w-64 rounded-full bg-indigo-600 opacity-20 blur-3xl"></div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
        <div className="flex flex-col md:flex-row items-center justify-between">
          <motion.div 
            className="text-center md:text-left mb-8 md:mb-0"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              {getGreeting()}
            </h1>
            <p className="text-xl text-blue-100 max-w-2xl">
              {getSubtitle()}
            </p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <Link 
              href="/mental-health-checkin" 
              className="px-6 py-2 rounded-xl bg-white text-blue-700 font-semibold hover:bg-blue-50 transition-colors shadow-lg shadow-blue-900/20 text-center"
            >
              Daily Check-in
            </Link>
            {userRole === 'counselor' ? (
              <Link 
                href="/counselor/sessions" 
                className="px-6 py-2 rounded-xl bg-blue-700/30 backdrop-blur-sm text-white font-semibold hover:bg-blue-700/50 transition-colors border border-white/20 text-center"
              >
                Manage Sessions
              </Link>
            ) : userRole === 'admin' ? (
              <Link 
                href="/admin/dashboard" 
                className="px-6 py-2 rounded-xl bg-blue-700/30 backdrop-blur-sm text-white font-semibold hover:bg-blue-700/50 transition-colors border border-white/20 text-center"
              >
                Admin Dashboard
              </Link>
            ) : (
              <Link 
                href="/book-session" 
                className="px-6 py-2 rounded-xl bg-blue-700/30 backdrop-blur-sm text-white font-semibold hover:bg-blue-700/50 transition-colors border border-white/20 text-center"
              >
                Book a Session
              </Link>
            )}
          </motion.div>
        </div>
      </div>
      
      {/* Wave divider */}
      <div className="relative bottom-0 left-0 right-0">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" className="w-full h-auto">
          <path
            fill="#ffffff"
            fillOpacity="1"
            d="M0,192L60,197.3C120,203,240,213,360,208C480,203,600,181,720,181.3C840,181,960,203,1080,208C1200,213,1320,203,1380,197.3L1440,192L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z"
          ></path>
        </svg>
      </div>
    </div>
  );
}
