"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent } from './ui/Card';
import { getUserStreak, hasCheckedInToday, initializeUserStreak } from '../services/streakService';

// Enhanced Icons for the cards with emojis and illustrations
const CheckInIcon = () => (
  <div className="relative inline-flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-blue-600 shadow-md shadow-blue-100/50">
    <div className="absolute inset-0 rounded-full bg-blue-200/30 blur-sm"></div>
    <div className="relative flex items-center justify-center">
      <span className="text-2xl">😊</span>
      <svg className="absolute -bottom-1 -right-1 h-6 w-6 text-blue-600 bg-white rounded-full p-1 shadow-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
      </svg>
    </div>
  </div>
);

const SessionIcon = () => (
  <div className="relative inline-flex h-16 w-16 items-center justify-center rounded-full bg-purple-100 text-purple-600 shadow-md shadow-purple-100/50">
    <div className="absolute inset-0 rounded-full bg-purple-200/30 blur-sm"></div>
    <div className="relative flex items-center justify-center">
      <span className="text-2xl">👩‍⚕️</span>
      <svg className="absolute -bottom-1 -right-1 h-6 w-6 text-purple-600 bg-white rounded-full p-1 shadow-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
      </svg>
    </div>
  </div>
);

const CommunityIcon = () => (
  <div className="relative inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600 shadow-md shadow-green-100/50">
    <div className="absolute inset-0 rounded-full bg-green-200/30 blur-sm"></div>
    <div className="relative flex items-center justify-center">
      <span className="text-2xl">👥</span>
      <svg className="absolute -bottom-1 -right-1 h-6 w-6 text-green-600 bg-white rounded-full p-1 shadow-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"></path>
      </svg>
    </div>
  </div>
);

// Resource Icons
const AnxietyIcon = () => (
  <div className="relative inline-flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-blue-600 shadow-md shadow-blue-100/50">
    <div className="absolute inset-0 rounded-full bg-blue-200/30 blur-sm"></div>
    <div className="relative flex items-center justify-center">
      <span className="text-2xl">⚡</span>
      <svg className="absolute -bottom-1 -right-1 h-6 w-6 text-blue-600 bg-white rounded-full p-1 shadow-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
      </svg>
    </div>
  </div>
);

const DepressionIcon = () => (
  <div className="relative inline-flex h-16 w-16 items-center justify-center rounded-full bg-purple-100 text-purple-600 shadow-md shadow-purple-100/50">
    <div className="absolute inset-0 rounded-full bg-purple-200/30 blur-sm"></div>
    <div className="relative flex items-center justify-center">
      <span className="text-2xl">💜</span>
      <svg className="absolute -bottom-1 -right-1 h-6 w-6 text-purple-600 bg-white rounded-full p-1 shadow-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
      </svg>
    </div>
  </div>
);

const CopingIcon = () => (
  <div className="relative inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600 shadow-md shadow-green-100/50">
    <div className="absolute inset-0 rounded-full bg-green-200/30 blur-sm"></div>
    <div className="relative flex items-center justify-center">
      <span className="text-2xl">🛡️</span>
      <svg className="absolute -bottom-1 -right-1 h-6 w-6 text-green-600 bg-white rounded-full p-1 shadow-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
      </svg>
    </div>
  </div>
);

// Action Card Component
const ActionCard = ({ href, icon, title, description, actionText, color = 'primary', className = '' }) => {
  const [isWiggling, setIsWiggling] = useState(false);
  const [quote, setQuote] = useState('');

  // Motivational micro-quotes
  const quotes = [
    "You got this.",
    "One step at a time.",
    "Progress, not perfection.",
    "Keep going!",
    "You matter.",
    "Be kind to yourself."
  ];

  const colorClasses = {
    primary: 'text-primary-600 group-hover:text-primary-700',
    secondary: 'text-secondary-600 group-hover:text-secondary-700',
    accent: 'text-accent-600 group-hover:text-accent-700'
  };

  const iconColorClasses = {
    primary: 'bg-blue-100 text-blue-600',
    secondary: 'bg-purple-100 text-purple-600',
    accent: 'bg-green-100 text-green-600'
  };

  const bgColorClasses = {
    primary: 'bg-gradient-to-br from-blue-50 to-blue-100/80',
    secondary: 'bg-gradient-to-br from-purple-50 to-purple-100/80',
    accent: 'bg-gradient-to-br from-green-50 to-green-100/80'
  };

  const tagColorClasses = {
    primary: 'bg-blue-100 text-blue-700',
    secondary: 'bg-purple-100 text-purple-700',
    accent: 'bg-green-100 text-green-700'
  };

  const borderColorClasses = {
    primary: 'border-blue-200/50',
    secondary: 'border-purple-200/50',
    accent: 'border-green-200/50'
  };

  const handleMouseEnter = () => {
    setIsWiggling(true);
    setQuote(quotes[Math.floor(Math.random() * quotes.length)]);
    setTimeout(() => setIsWiggling(false), 500); // Animation duration
  };

  return (
    <Link href={href} className="group block h-full">
      <Card
        className={`h-full min-h-[320px] flex flex-col transition-all duration-300 ${className} stagger-item animate-fade-in overflow-hidden ${bgColorClasses[color]} border ${borderColorClasses[color]} hover:shadow-lg hover:-translate-y-1`}
      >
        <CardContent
          className={`p-6 flex flex-col h-full transition-all duration-300 relative`}
          onMouseEnter={handleMouseEnter}
        >
          {/* Interactive background effect on hover */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-white/0 group-hover:from-white/30 group-hover:to-white/0 transition-all duration-500 opacity-0 group-hover:opacity-100"></div>

          {/* Content wrapper to keep above the background effect */}
          <div className="relative z-10">
            {/* Tag label */}
            <div className="mb-4">
              <span className={`inline-flex items-center gap-2 ${tagColorClasses[color]} text-xs px-3 py-1 rounded-full font-medium group-hover:shadow-sm transition-all duration-300`}>
                {title}
              </span>
            </div>

            <div className={`transform transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 ${isWiggling ? 'animate-wiggle' : ''} mb-4`}>
              {icon}
            </div>

            <h3 className="mb-3 text-xl font-semibold text-gray-900 font-heading group-hover:text-gray-800 transition-colors duration-300">{title}</h3>

            <p className="mb-4 text-gray-600 flex-grow group-hover:text-gray-700 transition-colors duration-300">
              {description}
            </p>

            {/* Motivational quote that appears on hover */}
            {quote && (
              <p className="text-sm italic text-gray-500 mb-3 animate-fade-in">
                "{quote}"
              </p>
            )}

            <span className={`mt-auto inline-flex items-center text-sm font-medium ${colorClasses[color]} bg-white/50 backdrop-blur-sm px-3 py-1.5 rounded-full self-start group-hover:shadow-sm group-hover:bg-white/80 transition-all duration-300`}>
              {actionText}
              <svg className="ml-1 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
              </svg>
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

// Enhanced Check-In Icon with emoji and animation
const EnhancedCheckInIcon = () => (
  <div className="relative inline-flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-blue-600 text-white shadow-lg shadow-blue-200">
    <div className="absolute -inset-1 rounded-full bg-blue-400/20 blur-md"></div>
    <div className="relative z-10 flex items-center justify-center">
      <span className="text-3xl">😊</span>
      <svg className="absolute -bottom-1 -right-1 h-7 w-7 text-white bg-blue-500 rounded-full p-1 shadow-md" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
      </svg>
    </div>
  </div>
);

// Regular User Cards
const UserActionCards = () => {
  const [quote, setQuote] = useState('');
  const [streakData, setStreakData] = useState({ currentStreak: 0, longestStreak: 0 });
  const [checkedInToday, setCheckedInToday] = useState(false);
  const [loading, setLoading] = useState(true);

  // Motivational micro-quotes
  const quotes = [
    "You got this.",
    "One step at a time.",
    "Progress, not perfection.",
    "Keep going!",
    "You matter.",
    "Be kind to yourself."
  ];

  // Fetch streak data on component mount
  useEffect(() => {
    async function fetchStreakData() {
      try {
        // Initialize streak record if needed
        await initializeUserStreak();

        // Get streak data and check-in status
        const streak = await getUserStreak();
        const checkedIn = await hasCheckedInToday();

        setStreakData(streak);
        setCheckedInToday(checkedIn);
      } catch (error) {
        console.error('Error fetching streak data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchStreakData();
  }, []);

  const handleMouseEnter = () => {
    setQuote(quotes[Math.floor(Math.random() * quotes.length)]);
  };

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
      {/* Primary Call to Action - Daily Check-in (spans 2 columns on medium screens) */}
      <div className="md:col-span-6 lg:col-span-5">
        <Link href="/mental-health-checkin" className="group block h-full">
          <div className="h-full min-h-[320px] overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 border border-blue-400/30 shadow-xl shadow-blue-200/30 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-300/50 hover:-translate-y-1 hover-glow stagger-item animate-fade-in">
            <div className="relative p-8 text-white h-full flex flex-col">
              {/* Decorative background circles */}
              <div className="absolute top-0 right-0 h-64 w-64 rounded-full bg-blue-400/20 -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
              <div className="absolute bottom-0 left-0 h-40 w-40 rounded-full bg-blue-600/20 translate-y-1/3 -translate-x-1/3 blur-xl"></div>

              <div className="relative z-10 flex flex-col h-full" onMouseEnter={handleMouseEnter}>
                {/* Tag label */}
                <div className="mb-4">
                  <span className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white text-xs px-3 py-1 rounded-full font-medium">
                    Daily Check-in
                  </span>
                </div>

                <div className="mb-6 transform transition-transform duration-300 group-hover:scale-105">
                  <EnhancedCheckInIcon />
                </div>

                <h3 className="mb-3 text-2xl font-bold text-white font-heading text-shadow">
                  Daily Check-in
                </h3>

                <p className="mb-6 text-blue-50 text-shadow-sm flex-grow">
                  Track your mood daily and see your progress over time.
                </p>

                {/* Streak counter */}
                <div className="mb-4 flex items-center">
                  <div className="bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2 flex items-center w-full">
                    <div className="flex flex-col w-full">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium text-white">
                          {loading ? 'Loading streak...' : `Current streak: ${streakData.currentStreak} day${streakData.currentStreak !== 1 ? 's' : ''}`}
                        </span>
                        {streakData.longestStreak > 0 && (
                          <span className="text-xs text-white/80">
                            Best: {streakData.longestStreak} day{streakData.longestStreak !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                      <div className="flex">
                        {/* Generate 5 dots based on current streak */}
                        {[...Array(5)].map((_, index) => {
                          // Determine if this dot should be filled
                          const isFilled = index < streakData.currentStreak;
                          // Today's dot should pulse if checked in
                          const isToday = index === streakData.currentStreak && checkedInToday;

                          return (
                            <div
                              key={index}
                              className={`h-5 w-5 rounded-full mx-1 ${isFilled ? 'bg-blue-300 shadow-glow' : isToday ? 'bg-green-300 shadow-glow animate-pulse-subtle' : 'bg-white/40'}`}
                            />
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Motivational quote that appears on hover */}
                {quote && (
                  <p className="text-sm italic text-blue-100 mb-4 animate-fade-in">
                    "{quote}"
                  </p>
                )}

                <span className="mt-auto inline-flex items-center rounded-full bg-white/20 backdrop-blur-sm px-4 py-2 text-sm font-medium text-white transition-all duration-300 group-hover:bg-white/30 self-start">
                  Start Check-in
                  <svg className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                  </svg>
                </span>
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* Secondary Cards */}
      <div className="md:col-span-6 lg:col-span-7">
        <div className="grid grid-cols-1 gap-6 h-full md:grid-cols-2">
          <ActionCard
            href="/book-session"
            icon={<SessionIcon />}
            title="Book a Session"
            description="Connect with professional counselors for one-on-one or group sessions."
            actionText="Book Now"
            color="secondary"
          />

          <ActionCard
            href="/community"
            icon={<CommunityIcon />}
            title="Community Forum"
            description="Join our supportive community to share experiences and find encouragement."
            actionText="Join Discussion"
            color="accent"
          />
        </div>
      </div>

      {/* Mental Health Resources Cards */}
      <div className="md:col-span-12 mt-8">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Mental Health Resources</h3>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <ActionCard
            href="/resources/anxiety"
            icon={<AnxietyIcon />}
            title="Anxiety Management"
            description="Learn techniques to manage anxiety and reduce stress in daily life."
            actionText="Learn more"
            color="primary"
          />

          <ActionCard
            href="/resources/depression"
            icon={<DepressionIcon />}
            title="Depression Resources"
            description="Find support and strategies for dealing with depression."
            actionText="Learn more"
            color="secondary"
          />

          <ActionCard
            href="/resources/coping"
            icon={<CopingIcon />}
            title="Coping Strategies"
            description="Discover effective techniques for managing stress and anxiety."
            actionText="Learn more"
            color="accent"
          />
        </div>
      </div>
    </div>
  );
};

// Enhanced Counselor Check-In Icon
const EnhancedCounselorCheckInIcon = () => (
  <div className="relative inline-flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-blue-600 text-white shadow-lg shadow-blue-200">
    <div className="absolute -inset-1 rounded-full bg-blue-400/20 blur-md"></div>
    <div className="relative z-10 flex items-center justify-center">
      <span className="text-3xl">👩‍⚕️</span>
      <svg className="absolute -bottom-1 -right-1 h-7 w-7 text-white bg-blue-500 rounded-full p-1 shadow-md" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
      </svg>
    </div>
  </div>
);

// Counselor Action Cards
const CounselorActionCards = () => {
  const [quote, setQuote] = useState('');

  // Motivational micro-quotes
  const quotes = [
    "Making a difference.",
    "Supporting others.",
    "Every check-in matters.",
    "You're helping someone today.",
    "Your guidance is valuable."
  ];

  const handleMouseEnter = () => {
    setQuote(quotes[Math.floor(Math.random() * quotes.length)]);
  };

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
      {/* Primary Call to Action - Client Check-ins */}
      <div className="md:col-span-6 lg:col-span-5">
        <Link href="/counselor/client-checkins" className="group block h-full">
          <div className="h-full min-h-[320px] overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 border border-blue-400/30 shadow-xl shadow-blue-200/30 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-300/50 hover:-translate-y-1 hover-glow stagger-item animate-fade-in">
            <div className="relative p-8 text-white h-full flex flex-col">
              {/* Decorative background circles */}
              <div className="absolute top-0 right-0 h-64 w-64 rounded-full bg-blue-400/20 -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
              <div className="absolute bottom-0 left-0 h-40 w-40 rounded-full bg-blue-600/20 translate-y-1/3 -translate-x-1/3 blur-xl"></div>

              <div className="relative z-10 flex flex-col h-full" onMouseEnter={handleMouseEnter}>
                {/* Tag label */}
                <div className="mb-4">
                  <span className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white text-xs px-3 py-1 rounded-full font-medium">
                    Client Check-ins
                  </span>
                </div>

                <div className="mb-6 transform transition-transform duration-300 group-hover:scale-105">
                  <EnhancedCounselorCheckInIcon />
                </div>

                <h3 className="mb-3 text-2xl font-bold text-white font-heading text-shadow">
                  Client Check-ins
                </h3>

                <p className="mb-6 text-blue-50 text-shadow-sm flex-grow">
                  Monitor client well-being and track their progress over time.
                </p>

                {/* Client activity indicator */}
                <div className="mb-4 flex items-center">
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg px-3 py-1.5 flex items-center">
                    <span className="text-xs font-medium text-white mr-2">Recent activity:</span>
                    <div className="flex items-center">
                      <div className="h-2 w-2 rounded-full bg-green-400 mr-1"></div>
                      <span className="text-xs text-white/80">5 new check-ins today</span>
                    </div>
                  </div>
                </div>

                {/* Motivational quote that appears on hover */}
                {quote && (
                  <p className="text-sm italic text-blue-100 mb-4 animate-fade-in">
                    "{quote}"
                  </p>
                )}

                <span className="mt-auto inline-flex items-center rounded-full bg-white/20 backdrop-blur-sm px-4 py-2 text-sm font-medium text-white transition-all duration-300 group-hover:bg-white/30 self-start">
                  View Check-ins
                  <svg className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                  </svg>
                </span>
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* Secondary Cards */}
      <div className="md:col-span-6 lg:col-span-7">
        <div className="grid grid-cols-1 gap-6 h-full md:grid-cols-1">
          <ActionCard
            href="/counselor/resources"
            icon={<CommunityIcon />}
            title="Community Support"
            description="Monitor community discussions and provide professional guidance."
            actionText="View Forum"
            color="accent"
          />
        </div>
      </div>

      {/* Mental Health Resources Cards */}
      <div className="md:col-span-12 mt-8">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Mental Health Resources</h3>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <ActionCard
            href="/resources/anxiety"
            icon={<AnxietyIcon />}
            title="Anxiety Management"
            description="Learn techniques to manage anxiety and reduce stress in daily life."
            actionText="Learn more"
            color="primary"
          />

          <ActionCard
            href="/resources/depression"
            icon={<DepressionIcon />}
            title="Depression Resources"
            description="Find support and strategies for dealing with depression."
            actionText="Learn more"
            color="secondary"
          />

          <ActionCard
            href="/resources/coping"
            icon={<CopingIcon />}
            title="Coping Strategies"
            description="Discover effective techniques for managing stress and anxiety."
            actionText="Learn more"
            color="accent"
          />
        </div>
      </div>
    </div>
  );
};

// Enhanced Admin Analytics Icon
const EnhancedAdminAnalyticsIcon = () => (
  <div className="relative inline-flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-blue-600 text-white shadow-lg shadow-blue-200">
    <div className="absolute -inset-1 rounded-full bg-blue-400/20 blur-md"></div>
    <div className="relative z-10 flex items-center justify-center">
      <span className="text-3xl">📊</span>
      <svg className="absolute -bottom-1 -right-1 h-7 w-7 text-white bg-blue-500 rounded-full p-1 shadow-md" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"></path>
      </svg>
    </div>
  </div>
);

// Admin Action Cards
const AdminActionCards = () => {
  const [quote, setQuote] = useState('');

  // Motivational micro-quotes
  const quotes = [
    "Data tells a story.",
    "Insights drive improvement.",
    "Helping the helpers.",
    "Making informed decisions.",
    "Optimizing for well-being."
  ];

  const handleMouseEnter = () => {
    setQuote(quotes[Math.floor(Math.random() * quotes.length)]);
  };

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
      {/* Primary Call to Action - Analytics */}
      <div className="md:col-span-6 lg:col-span-5">
        <Link href="/admin/checkin-analytics" className="group block h-full">
          <div className="h-full min-h-[320px] overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 border border-blue-400/30 shadow-xl shadow-blue-200/30 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-300/50 hover:-translate-y-1 hover-glow stagger-item animate-fade-in">
            <div className="relative p-8 text-white h-full flex flex-col">
              {/* Decorative background circles */}
              <div className="absolute top-0 right-0 h-64 w-64 rounded-full bg-blue-400/20 -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
              <div className="absolute bottom-0 left-0 h-40 w-40 rounded-full bg-blue-600/20 translate-y-1/3 -translate-x-1/3 blur-xl"></div>

              <div className="relative z-10 flex flex-col h-full" onMouseEnter={handleMouseEnter}>
                {/* Tag label */}
                <div className="mb-4">
                  <span className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white text-xs px-3 py-1 rounded-full font-medium">
                    Analytics Dashboard
                  </span>
                </div>

                <div className="mb-6 transform transition-transform duration-300 group-hover:scale-105">
                  <EnhancedAdminAnalyticsIcon />
                </div>

                <h3 className="mb-3 text-2xl font-bold text-white font-heading text-shadow">
                  Check-in Analytics
                </h3>

                <p className="mb-6 text-blue-50 text-shadow-sm flex-grow">
                  View platform statistics and identify trends to improve user experience.
                </p>

                {/* Analytics summary */}
                <div className="mb-4 flex items-center">
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg px-3 py-1.5 w-full">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-medium text-white">Platform activity:</span>
                      <span className="text-xs text-white/80">+12% this week</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-1.5">
                      <div className="bg-blue-300 h-1.5 rounded-full" style={{ width: '72%' }}></div>
                    </div>
                  </div>
                </div>

                {/* Motivational quote that appears on hover */}
                {quote && (
                  <p className="text-sm italic text-blue-100 mb-4 animate-fade-in">
                    "{quote}"
                  </p>
                )}

                <span className="mt-auto inline-flex items-center rounded-full bg-white/20 backdrop-blur-sm px-4 py-2 text-sm font-medium text-white transition-all duration-300 group-hover:bg-white/30 self-start">
                  View Analytics
                  <svg className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                  </svg>
                </span>
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* Secondary Cards */}
      <div className="md:col-span-6 lg:col-span-7">
        <div className="grid grid-cols-1 gap-6 h-full md:grid-cols-2">
          <ActionCard
            href="/admin/session-management"
            icon={<SessionIcon />}
            title="Session Management"
            description="Monitor all counseling sessions and counselor workload."
            actionText="View Sessions"
            color="secondary"
          />

          <ActionCard
            href="/admin/forum-moderation"
            icon={<CommunityIcon />}
            title="Forum Moderation"
            description="Moderate community discussions and manage user permissions."
            actionText="Moderate Forum"
            color="accent"
          />
        </div>
      </div>

      {/* Mental Health Resources Cards */}
      <div className="md:col-span-12 mt-8">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Mental Health Resources</h3>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <ActionCard
            href="/resources/anxiety"
            icon={<AnxietyIcon />}
            title="Anxiety Management"
            description="Learn techniques to manage anxiety and reduce stress in daily life."
            actionText="Learn more"
            color="primary"
          />

          <ActionCard
            href="/resources/depression"
            icon={<DepressionIcon />}
            title="Depression Resources"
            description="Find support and strategies for dealing with depression."
            actionText="Learn more"
            color="secondary"
          />

          <ActionCard
            href="/resources/coping"
            icon={<CopingIcon />}
            title="Coping Strategies"
            description="Discover effective techniques for managing stress and anxiety."
            actionText="Learn more"
            color="accent"
          />
        </div>
      </div>
    </div>
  );
};

// Main component that renders different cards based on user role
const RoleBasedActionCards = ({ userRole }) => {
  return (
    <div className="py-12">
      <h2 className="text-3xl font-bold text-gray-900 mb-8 font-heading text-center">What would you like to do today?</h2>
      {userRole === 'counselor' ? (
        <CounselorActionCards />
      ) : userRole === 'admin' ? (
        <AdminActionCards />
      ) : (
        <UserActionCards />
      )}
    </div>
  );
};

export default RoleBasedActionCards;
