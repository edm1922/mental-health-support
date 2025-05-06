import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useUser } from '@/utils/useUser';
import { useUserProfile } from '@/utils/useUserProfile';
import { useAuth } from '@/utils/useAuth';
import SearchBar from './SearchBar';
import NotificationBell from './NotificationBell';
import { useNotification } from '@/context/NotificationContext';

export default function CounselorNavbar({ transparent = false }) {
  const { data: user } = useUser();
  const { profile: userProfile, loading: profileLoading } = useUserProfile();
  const { signOut } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [scrolled]);

  const handleSignOut = async () => {
    try {
      await signOut();
      showSuccess('Successfully signed out');
      // Add stay=true parameter to prevent middleware from redirecting
      window.location.href = '/?stay=true';
    } catch (error) {
      console.error('Error signing out:', error);
      showError('Failed to sign out. Please try again.');
    }
  };

  // Determine navbar background
  const navbarBg = transparent
    ? scrolled
      ? 'bg-indigo-900/95 backdrop-blur-md shadow-md'
      : 'bg-transparent'
    : 'bg-indigo-900 shadow-md';

  // Text is always white for counselor navbar
  const textColor = 'text-white';
  const logoColor = 'text-white';

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${navbarBg}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/counselor/dashboard/direct" className={`flex-shrink-0 flex items-center font-bold text-lg md:text-xl truncate max-w-[180px] sm:max-w-none ${logoColor}`}>
              <span className="mr-2">👨‍⚕️</span> Counselor Portal
            </Link>
            <div className="hidden md:ml-8 md:flex md:space-x-6">
              <Link href="/counselor/dashboard/direct" className={`px-3 py-2 rounded-md text-sm font-medium ${textColor} hover:text-indigo-200 transition-colors`}>
                Dashboard
              </Link>
              <Link href="/counselor/sessions" className={`px-3 py-2 rounded-md text-sm font-medium ${textColor} hover:text-indigo-200 transition-colors`}>
                Sessions
              </Link>
              <Link href="/counselor/clients" className={`px-3 py-2 rounded-md text-sm font-medium ${textColor} hover:text-indigo-200 transition-colors`}>
                Clients
              </Link>
              <Link href="/counselor/check-ins" className={`px-3 py-2 rounded-md text-sm font-medium ${textColor} hover:text-indigo-200 transition-colors`}>
                Check-ins
              </Link>
              <Link href="/community" className={`px-3 py-2 rounded-md text-sm font-medium ${textColor} hover:text-indigo-200 transition-colors`}>
                Community
              </Link>
              <Link href="/messages" className={`px-3 py-2 rounded-md text-sm font-medium ${textColor} hover:text-indigo-200 transition-colors`}>
                Messages
              </Link>
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-4">
            <SearchBar
              className="block"
              placeholder="Search clients..."
              darkMode={true}
              onSearch={(term) => {
                window.location.href = `/counselor/search?q=${encodeURIComponent(term)}`;
              }}
            />
            <NotificationBell darkMode={true} />
            {user && (
              <div className="relative ml-1 sm:ml-3">
                <div>
                  <button
                    onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                    className="flex items-center max-w-xs text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-300"
                    id="user-menu-button"
                    aria-expanded="false"
                    aria-haspopup="true"
                  >
                    <span className="sr-only">Open user menu</span>
                    <div className="h-8 w-8 rounded-full bg-indigo-300 flex items-center justify-center text-indigo-900">
                      {userProfile?.display_name ? userProfile.display_name.charAt(0).toUpperCase() :
                       user.email ? user.email.charAt(0).toUpperCase() : 'C'}
                    </div>
                    <span className={`ml-2 hidden sm:inline ${textColor} max-w-[100px] truncate`}>{userProfile?.display_name || user.email}</span>
                    <svg className={`ml-1 h-5 w-5 ${textColor}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>

                {profileMenuOpen && (
                  <div
                    className="origin-top-right absolute right-0 mt-2 w-48 rounded-xl shadow-soft bg-white ring-1 ring-black ring-opacity-5 py-1 focus:outline-none animate-fade-in"
                    role="menu"
                    aria-orientation="vertical"
                    aria-labelledby="user-menu-button"
                    tabIndex="-1"
                  >
                    <Link href="/counselor/dashboard/direct" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" role="menuitem">
                      Dashboard
                    </Link>
                    <Link href="/counselor/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" role="menuitem">
                      Your Profile
                    </Link>
                    <Link href="/counselor/settings" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" role="menuitem">
                      Settings
                    </Link>
                    <Link href="/home" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" role="menuitem">
                      Switch to User View
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      role="menuitem"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Mobile menu button */}
            <div className="flex md:hidden ml-4">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className={`inline-flex items-center justify-center p-2 rounded-md ${textColor} hover:text-indigo-200 hover:bg-indigo-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-300 active:bg-indigo-700`}
              >
                <span className="sr-only">Open main menu</span>
                {mobileMenuOpen ? (
                  <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-indigo-800 shadow-lg fixed top-16 left-0 right-0 z-50 max-h-[80vh] overflow-y-auto">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <div className="px-3 py-2 mb-2">
              <SearchBar
                className="block sm:hidden w-full"
                placeholder="Search clients..."
                darkMode={true}
                onSearch={(term) => {
                  setMobileMenuOpen(false);
                  window.location.href = `/counselor/search?q=${encodeURIComponent(term)}`;
                }}
              />
            </div>
            <Link
              href="/counselor/dashboard/direct"
              className="block px-3 py-3 rounded-md text-base font-medium text-white hover:text-indigo-200 hover:bg-indigo-700 border-b border-indigo-700"
              onClick={() => setMobileMenuOpen(false)}
            >
              Dashboard
            </Link>
            <Link
              href="/counselor/sessions"
              className="block px-3 py-3 rounded-md text-base font-medium text-white hover:text-indigo-200 hover:bg-indigo-700 border-b border-indigo-700"
              onClick={() => setMobileMenuOpen(false)}
            >
              Sessions
            </Link>
            <Link
              href="/counselor/clients"
              className="block px-3 py-3 rounded-md text-base font-medium text-white hover:text-indigo-200 hover:bg-indigo-700 border-b border-indigo-700"
              onClick={() => setMobileMenuOpen(false)}
            >
              Clients
            </Link>
            <Link
              href="/counselor/check-ins"
              className="block px-3 py-3 rounded-md text-base font-medium text-white hover:text-indigo-200 hover:bg-indigo-700 border-b border-indigo-700"
              onClick={() => setMobileMenuOpen(false)}
            >
              Check-ins
            </Link>
            <Link
              href="/community"
              className="block px-3 py-3 rounded-md text-base font-medium text-white hover:text-indigo-200 hover:bg-indigo-700 border-b border-indigo-700"
              onClick={() => setMobileMenuOpen(false)}
            >
              Community
            </Link>
            <Link
              href="/messages"
              className="block px-3 py-3 rounded-md text-base font-medium text-white hover:text-indigo-200 hover:bg-indigo-700 border-b border-indigo-700"
              onClick={() => setMobileMenuOpen(false)}
            >
              Messages
            </Link>
            <Link
              href="/counselor/profile"
              className="block px-3 py-3 rounded-md text-base font-medium text-white hover:text-indigo-200 hover:bg-indigo-700 border-b border-indigo-700"
              onClick={() => setMobileMenuOpen(false)}
            >
              Your Profile
            </Link>
            <Link
              href="/home"
              className="block px-3 py-3 rounded-md text-base font-medium text-white hover:text-indigo-200 hover:bg-indigo-700 border-b border-indigo-700"
              onClick={() => setMobileMenuOpen(false)}
            >
              Switch to User View
            </Link>
            <button
              onClick={() => {
                handleSignOut();
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-3 rounded-md text-base font-medium text-red-300 hover:text-red-200 hover:bg-indigo-700"
            >
              Sign Out
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
