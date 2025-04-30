"use client";
import React, { useState, useEffect, useRef } from "react";
import { useUser } from '@/utils/useUser';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/utils/supabaseClient';
import { useAuth } from '@/utils/useAuth';
import Link from 'next/link';
import DatabaseAutoFix from '@/components/DatabaseAutoFix';
import { useOnClickOutside } from '@/utils/hooks';

export default function AdminLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: user, loading: userLoading } = useUser();
  const { signOut } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef(null);
  const mobileMenuRef = useRef(null);

  // Close dropdown when clicking outside
  useOnClickOutside(dropdownRef, () => setDropdownOpen(false));
  useOnClickOutside(mobileMenuRef, () => setMobileMenuOpen(false));

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/account/signin');
    } catch (err) {
      console.error('Error signing out:', err);
      setError('Failed to sign out. Please try again.');
    }
  };

  useEffect(() => {
    if (user) {
      checkAdminStatus();
    } else if (!userLoading) {
      // User is not logged in
      router.push('/account/signin?redirect=/admin');
    }
  }, [user, userLoading]);

  const checkAdminStatus = async () => {
    try {
      console.log("Checking admin status for user:", user.id);

      // First check if the user is an admin
      const adminResponse = await fetch("/api/admin/check-admin-status", {
        headers: {
          "Authorization": `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      });
      const adminData = await adminResponse.json();
      console.log("Admin check response:", adminData);

      if (!adminResponse.ok) {
        console.error("Admin check API error:", adminData);
        setError(`Admin check failed: ${adminData.error || 'Unknown error'}`);
        setLoading(false);
        return;
      }

      if (!adminData.isAdmin) {
        console.log("User is not an admin, redirecting to home");
        setError("You do not have admin privileges. If you believe this is an error, please contact support.");
        setLoading(false);
        router.push('/');
        return;
      }

      setIsAdmin(true);
      setLoading(false);
    } catch (err) {
      console.error("Error checking admin status:", err);
      setError(err.message || "Failed to verify admin status");
      setLoading(false);
    }
  };

  if (userLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-xl p-8 max-w-md w-full">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link href="/" className="block w-full bg-indigo-600 text-white text-center py-2 px-4 rounded-lg hover:bg-indigo-700">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-xl p-8 max-w-md w-full">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Authentication Required</h1>
          <p className="text-gray-600 mb-6">Please sign in to access the admin area.</p>
          <Link href="/account/signin?redirect=/admin" className="block w-full bg-indigo-600 text-white text-center py-2 px-4 rounded-lg hover:bg-indigo-700">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null; // This will be handled by the redirect in checkAdminStatus
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Include the DatabaseAutoFix component to automatically fix database issues */}
      <DatabaseAutoFix />

      <nav className="bg-gradient-to-r from-purple-800 to-indigo-700 text-white shadow-lg border-b border-purple-900/20 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Left side - Logo and Navigation */}
            <div className="flex items-center space-x-1 md:space-x-4">
              <div className="flex-shrink-0 flex items-center">
                <Link
                  href="/admin"
                  className="font-bold text-xl flex items-center group"
                >
                  <span className="bg-white/10 p-1.5 rounded-lg mr-2 group-hover:bg-white/20 transition-colors duration-200">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </span>
                  Admin Portal
                </Link>
              </div>

              {/* Desktop Navigation */}
              <div className="hidden md:flex md:items-center md:space-x-1">
                <Link
                  href="/admin"
                  className={`nav-item px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 flex items-center space-x-1 ${pathname === '/admin' ? 'bg-white/20 text-white font-semibold' : 'hover:bg-white/10'}`}
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  <span>Dashboard</span>
                </Link>

                <Link
                  href="/admin/counselor-applications"
                  className={`nav-item px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 flex items-center space-x-1 ${pathname === '/admin/counselor-applications' ? 'bg-white/20 text-white font-semibold' : 'hover:bg-white/10'}`}
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <span>Applications</span>
                </Link>

                <Link
                  href="/admin/forum-moderation"
                  className={`nav-item px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 flex items-center space-x-1 ${pathname === '/admin/forum-moderation' ? 'bg-white/20 text-white font-semibold' : 'hover:bg-white/10'}`}
                >
                  <div className="relative">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                    </svg>
                    {/* Notification dot - can be conditionally rendered based on pending posts */}
                    <span className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full"></span>
                  </div>
                  <span>Moderation</span>
                </Link>

                <Link
                  href="/admin/database-management"
                  className={`nav-item px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 flex items-center space-x-1 ${pathname === '/admin/database-management' ? 'bg-white/20 text-white font-semibold' : 'hover:bg-white/10'}`}
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                  </svg>
                  <span>Database</span>
                </Link>

                <Link
                  href="/admin/checkin-analytics"
                  className={`nav-item px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 flex items-center space-x-1 ${pathname === '/admin/checkin-analytics' ? 'bg-white/20 text-white font-semibold' : 'hover:bg-white/10'}`}
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <span>Analytics</span>
                </Link>
              </div>
            </div>

            {/* Right side - User actions */}
            <div className="flex items-center space-x-2">
              {/* Back to site link */}
              <Link
                href="/"
                className="hidden md:flex items-center px-3 py-2 rounded-md text-sm font-medium hover:bg-white/10 transition-colors duration-200"
              >
                <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Site
              </Link>

              {/* User dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center space-x-2 focus:outline-none"
                  aria-expanded={dropdownOpen}
                  aria-haspopup="true"
                >
                  <span className="hidden md:inline-block text-sm text-indigo-100 group-hover:text-white transition-colors duration-200">
                    {user.email}
                  </span>
                  <div className="h-9 w-9 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-700 flex items-center justify-center shadow-md border-2 border-indigo-300 hover:scale-110 transition-all duration-300 cursor-pointer">
                    {user.email ? user.email.charAt(0).toUpperCase() : 'U'}
                  </div>
                </button>

                {/* Dropdown menu */}
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                    <div className="px-4 py-2 text-sm text-gray-700 border-b border-gray-100">
                      <p className="font-medium text-gray-900">Signed in as</p>
                      <p className="truncate">{user.email}</p>
                    </div>

                    <Link
                      href="/admin/profile"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Account Settings
                    </Link>

                    <button
                      onClick={handleSignOut}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>

              {/* Mobile menu button */}
              <div className="-mr-2 flex md:hidden">
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="inline-flex items-center justify-center p-2 rounded-md text-indigo-100 hover:text-white hover:bg-white/10 focus:outline-none"
                >
                  <span className="sr-only">Open main menu</span>
                  {mobileMenuOpen ? (
                    <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  ) : (
                    <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Mobile menu */}
          <div className={`${mobileMenuOpen ? 'block' : 'hidden'} md:hidden`} ref={mobileMenuRef}>
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              <Link
                href="/admin"
                className={`block px-3 py-2 rounded-md text-base font-medium ${pathname === '/admin' ? 'bg-white/20 text-white' : 'hover:bg-white/10'}`}
              >
                Dashboard
              </Link>

              <Link
                href="/admin/counselor-applications"
                className={`block px-3 py-2 rounded-md text-base font-medium ${pathname === '/admin/counselor-applications' ? 'bg-white/20 text-white' : 'hover:bg-white/10'}`}
              >
                Applications
              </Link>

              <Link
                href="/admin/forum-moderation"
                className={`block px-3 py-2 rounded-md text-base font-medium ${pathname === '/admin/forum-moderation' ? 'bg-white/20 text-white' : 'hover:bg-white/10'}`}
              >
                Moderation
              </Link>

              <Link
                href="/admin/database-management"
                className={`block px-3 py-2 rounded-md text-base font-medium ${pathname === '/admin/database-management' ? 'bg-white/20 text-white' : 'hover:bg-white/10'}`}
              >
                Database
              </Link>

              <Link
                href="/admin/checkin-analytics"
                className={`block px-3 py-2 rounded-md text-base font-medium ${pathname === '/admin/checkin-analytics' ? 'bg-white/20 text-white' : 'hover:bg-white/10'}`}
              >
                Analytics
              </Link>

              <Link
                href="/home"
                className="block px-3 py-2 rounded-md text-base font-medium hover:bg-white/10"
              >
                Back to Site
              </Link>

              <button
                onClick={handleSignOut}
                className="block w-full text-left px-3 py-2 rounded-md text-base font-medium hover:bg-white/10"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {children}
        </div>
      </div>
    </div>
  );
}
