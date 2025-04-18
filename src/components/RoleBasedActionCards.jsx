import React from 'react';
import Link from 'next/link';

// Icons for the cards
const CheckInIcon = () => (
  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600">
    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
    </svg>
  </div>
);

const SessionIcon = () => (
  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
    </svg>
  </div>
);

const CommunityIcon = () => (
  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 text-purple-600">
    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
    </svg>
  </div>
);

// Regular User Cards
const UserActionCards = () => {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
      <Link href="/mental-health-checkin" className="group relative rounded-xl bg-white p-6 shadow-md transition-all hover:shadow-lg">
        <CheckInIcon />
        <h3 className="mb-2 text-xl font-semibold text-gray-900">Daily Check-in</h3>
        <p className="mb-4 text-gray-600">
          Track your mental well-being with our daily mood check-in system.
        </p>
        <span className="mt-2 inline-flex items-center text-sm font-medium text-blue-600 group-hover:text-blue-700">
          Start Check-in
          <svg className="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
          </svg>
        </span>
      </Link>

      <Link href="/book-session" className="group relative rounded-xl bg-white p-6 shadow-md transition-all hover:shadow-lg">
        <SessionIcon />
        <h3 className="mb-2 text-xl font-semibold text-gray-900">Book a Session</h3>
        <p className="mb-4 text-gray-600">
          Connect with professional counselors for one-on-one or group sessions.
        </p>
        <span className="mt-2 inline-flex items-center text-sm font-medium text-indigo-600 group-hover:text-indigo-700">
          Book Now
          <svg className="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
          </svg>
        </span>
      </Link>

      <Link href="/community" className="group relative rounded-xl bg-white p-6 shadow-md transition-all hover:shadow-lg">
        <CommunityIcon />
        <h3 className="mb-2 text-xl font-semibold text-gray-900">Community Forum</h3>
        <p className="mb-4 text-gray-600">
          Join our supportive community to share experiences and find encouragement.
        </p>
        <span className="mt-2 inline-flex items-center text-sm font-medium text-purple-600 group-hover:text-purple-700">
          Join Discussion
          <svg className="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
          </svg>
        </span>
      </Link>
    </div>
  );
};

// Counselor Action Cards
const CounselorActionCards = () => {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
      <Link href="/counselor/client-checkins" className="group relative rounded-xl bg-white p-6 shadow-md transition-all hover:shadow-lg">
        <CheckInIcon />
        <h3 className="mb-2 text-xl font-semibold text-gray-900">Client Check-ins</h3>
        <p className="mb-4 text-gray-600">
          View recent check-ins from your clients and monitor their well-being.
        </p>
        <span className="mt-2 inline-flex items-center text-sm font-medium text-blue-600 group-hover:text-blue-700">
          View Check-ins
          <svg className="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
          </svg>
        </span>
      </Link>

      <Link href="/counselor/sessions" className="group relative rounded-xl bg-white p-6 shadow-md transition-all hover:shadow-lg">
        <SessionIcon />
        <h3 className="mb-2 text-xl font-semibold text-gray-900">Manage Sessions</h3>
        <p className="mb-4 text-gray-600">
          View and manage your upcoming counseling sessions and availability.
        </p>
        <span className="mt-2 inline-flex items-center text-sm font-medium text-indigo-600 group-hover:text-indigo-700">
          View Schedule
          <svg className="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
          </svg>
        </span>
      </Link>

      <Link href="/counselor/resources" className="group relative rounded-xl bg-white p-6 shadow-md transition-all hover:shadow-lg">
        <CommunityIcon />
        <h3 className="mb-2 text-xl font-semibold text-gray-900">Community Support</h3>
        <p className="mb-4 text-gray-600">
          Monitor community discussions and provide professional guidance.
        </p>
        <span className="mt-2 inline-flex items-center text-sm font-medium text-purple-600 group-hover:text-purple-700">
          View Forum
          <svg className="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
          </svg>
        </span>
      </Link>
    </div>
  );
};

// Admin Action Cards
const AdminActionCards = () => {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
      <Link href="/admin/checkin-analytics" className="group relative rounded-xl bg-white p-6 shadow-md transition-all hover:shadow-lg">
        <CheckInIcon />
        <h3 className="mb-2 text-xl font-semibold text-gray-900">Check-in Analytics</h3>
        <p className="mb-4 text-gray-600">
          View platform-wide check-in statistics and identify trends.
        </p>
        <span className="mt-2 inline-flex items-center text-sm font-medium text-blue-600 group-hover:text-blue-700">
          View Analytics
          <svg className="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
          </svg>
        </span>
      </Link>

      <Link href="/admin/session-management" className="group relative rounded-xl bg-white p-6 shadow-md transition-all hover:shadow-lg">
        <SessionIcon />
        <h3 className="mb-2 text-xl font-semibold text-gray-900">Session Management</h3>
        <p className="mb-4 text-gray-600">
          Monitor all counseling sessions and counselor workload.
        </p>
        <span className="mt-2 inline-flex items-center text-sm font-medium text-indigo-600 group-hover:text-indigo-700">
          View Sessions
          <svg className="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
          </svg>
        </span>
      </Link>

      <Link href="/admin/forum-moderation" className="group relative rounded-xl bg-white p-6 shadow-md transition-all hover:shadow-lg">
        <CommunityIcon />
        <h3 className="mb-2 text-xl font-semibold text-gray-900">Forum Moderation</h3>
        <p className="mb-4 text-gray-600">
          Moderate community discussions and manage user permissions.
        </p>
        <span className="mt-2 inline-flex items-center text-sm font-medium text-purple-600 group-hover:text-purple-700">
          Moderate Forum
          <svg className="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
          </svg>
        </span>
      </Link>
    </div>
  );
};

// Main component that renders different cards based on user role
const RoleBasedActionCards = ({ userRole }) => {
  if (userRole === 'counselor') {
    return <CounselorActionCards />;
  } else if (userRole === 'admin') {
    return <AdminActionCards />;
  } else {
    return <UserActionCards />;
  }
};

export default RoleBasedActionCards;
