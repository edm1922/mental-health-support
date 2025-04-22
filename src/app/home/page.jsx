"use client";
import React from "react";
import { useRouter } from "next/navigation";
import Navbar from '../../components/ui/Navbar';
import Hero from '../../components/ui/Hero';
import Footer from '../../components/ui/Footer';
import RoleBasedActionCards from '../../components/RoleBasedActionCards';
import { useUser } from '../../utils/useUser';
import { useNotification } from '../../context/NotificationContext';

export default function HomePage() {
  const router = useRouter();
  const { data: user, loading: userLoading, profile } = useUser();
  const { showSuccess, showError, showInfo, showWarning } = useNotification();

  return (
    <div className="min-h-screen bg-white">
      {/* Modern Navbar */}
      <Navbar transparent />

      {/* Hero Section */}
      <Hero
        tagline="You're not alone"
        title="Take a Step Toward Feeling Better"
        subtitle="Talk to a counselor, check in with yourself, or connect with others who care."
        image="/images/hero-illustration.svg"
      />

      <div className="mx-auto max-w-7xl px-6 sm:px-8">
        {/* Role-based action cards */}
        <RoleBasedActionCards userRole={profile?.role || 'user'} />

        {/* Test notification buttons */}
        <div className="mt-8 mb-12 p-6 bg-white/80 backdrop-blur-md rounded-xl shadow-lg border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">Test Notifications</h3>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => showInfo('This is an information notification')}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              Show Info
            </button>
            <button
              onClick={() => showSuccess('This is a success notification')}
              className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
            >
              Show Success
            </button>
            <button
              onClick={() => showWarning('This is a warning notification')}
              className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition-colors"
            >
              Show Warning
            </button>
            <button
              onClick={() => showError('This is an error notification')}
              className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
            >
              Show Error
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}
