"use client";
import React from "react";
import Link from "next/link";

export default function CounselorDashboardCard({ sessionCount = 0 }) {
  return (
    <div className="rounded-xl bg-gradient-to-r from-indigo-600 to-blue-500 p-6 text-white shadow-xl">
      <h2 className="text-2xl font-bold">Counselor Dashboard</h2>
      <p className="mt-2 opacity-90">
        Manage your counseling sessions and help clients on their mental health journey.
      </p>
      
      <div className="mt-6 flex items-center gap-4">
        <div className="rounded-lg bg-white/20 p-3 backdrop-blur-sm">
          <span className="block text-center text-2xl font-bold">{sessionCount}</span>
          <span className="text-sm">Active Sessions</span>
        </div>
        
        <div className="flex-1">
          <p className="text-sm opacity-90">
            You can view and manage all your upcoming and past counseling sessions.
          </p>
        </div>
      </div>
      
      <div className="mt-6 flex gap-3">
        <Link
          href="/counselor/sessions"
          className="flex-1 rounded-lg bg-white px-4 py-2 text-center font-medium text-indigo-700 hover:bg-indigo-50"
        >
          View Sessions
        </Link>
        
        <Link
          href="/counselor/profile"
          className="flex-1 rounded-lg bg-indigo-700/30 px-4 py-2 text-center font-medium text-white hover:bg-indigo-700/50"
        >
          Edit Profile
        </Link>
      </div>
    </div>
  );
}
