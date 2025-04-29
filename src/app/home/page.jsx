"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from '../../components/ui/Navbar';
import Hero from '../../components/ui/Hero';
import Footer from '../../components/ui/Footer';
import RoleBasedActionCards from '../../components/RoleBasedActionCards';
import { useUser } from '../../utils/useUser';
import { useNotification } from '../../context/NotificationContext';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import dynamic from 'next/dynamic';

// Dynamically import the EmotionAIAssistant component with no SSR
const EmotionAIAssistant = dynamic(
  () => import('../../components/EmotionAIAssistant'),
  { ssr: false }
);

export default function HomePage() {
  const router = useRouter();
  const { data: user, loading: userLoading, profile } = useUser();
  const { showSuccess, showError, showInfo, showWarning } = useNotification();
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    // Simulate loading delay
    const timer = setTimeout(() => {
      setPageLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (pageLoading || userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <LoadingSpinner size="large" color="primary" text="Loading home page..." />
      </div>
    );
  }

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


      </div>

      {/* Footer */}
      <Footer />

      {/* Emotion AI Assistant - shown for all users */}
      {user && (
        <EmotionAIAssistant />
      )}
    </div>
  );
}
