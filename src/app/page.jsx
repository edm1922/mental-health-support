"use client";
import React from "react";
import RoleBasedRedirect from '../components/RoleBasedRedirect';
import DatabaseSchemaCheck from '../components/DatabaseSchemaCheck';
import dynamic from 'next/dynamic';

// Dynamically import the landing page component to reduce initial load time
const LandingPage = dynamic(() => import('../components/landing/LandingPage'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 to-indigo-800">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
    </div>
  )
});

function MainComponent() {
  return (
    <div className="min-h-screen">
      {/* Role-based redirect component - redirects authenticated users to their dashboard */}
      <RoleBasedRedirect />

      {/* Database schema check component - runs on page load */}
      <DatabaseSchemaCheck />

      {/* Landing Page Component */}
      <LandingPage />
    </div>
  );
}

export default MainComponent;