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


      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}
