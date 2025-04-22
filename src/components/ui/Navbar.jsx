import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useUser } from '@/utils/useUser';
import { useUserProfile } from '@/utils/useUserProfile';
import { useAuth } from '@/utils/useAuth';

export default function Navbar({ transparent = false }) {
  const { data: user } = useUser();
  const { profile: userProfile, loading: profileLoading } = useUserProfile();
  const { signOut } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [userRole, setUserRole] = useState(null);

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

  // Get user role
  useEffect(() => {
    if (user) {
      fetchUserRole();
    }
  }, [user]);

  const fetchUserRole = async () => {
    try {
      const response = await fetch('/api/user/role');
      const data = await response.json();
      if (data.role) {
        setUserRole(data.role);
      }
    } catch (error) {
      console.error('Error fetching user role:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      window.location.href = '/';
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Determine navbar background
  const navbarBg = transparent
    ? scrolled
      ? 'bg-white/90 backdrop-blur-md shadow-md'
      : 'bg-transparent'
    : 'bg-white shadow-md';

  // Determine text color
  const textColor = transparent && !scrolled ? 'text-white' : 'text-gray-800';
  const logoColor = transparent && !scrolled ? 'text-white' : 'text-primary-600';

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${navbarBg}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/home" className={`flex-shrink-0 flex items-center font-bold text-xl ${logoColor}`}>
              Mental Health Support
            </Link>
            <div className="hidden md:ml-8 md:flex md:space-x-6">
              <Link href="/home" className={`px-3 py-2 rounded-md text-sm font-medium ${textColor} hover:text-primary-600 transition-colors`}>
                Home
              </Link>
              <Link href="/mental-health-checkin" className={`px-3 py-2 rounded-md text-sm font-medium ${textColor} hover:text-primary-600 transition-colors`}>
                Daily Check-in
              </Link>
              <Link href="/book-session" className={`px-3 py-2 rounded-md text-sm font-medium ${textColor} hover:text-primary-600 transition-colors`}>
                Book a Session
              </Link>
              <Link href="/community" className={`px-3 py-2 rounded-md text-sm font-medium ${textColor} hover:text-primary-600 transition-colors`}>
                Community
              </Link>
              {user && (
                <Link href="/messages" className={`px-3 py-2 rounded-md text-sm font-medium ${textColor} hover:text-primary-600 transition-colors`}>
                  Messages
                </Link>
              )}
            </div>
          </div>

          <div className="flex items-center">
            {user ? (
              <div className="relative ml-3">
                <div>
                  <button
                    onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                    className="flex items-center max-w-xs text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    id="user-menu-button"
                    aria-expanded="false"
                    aria-haspopup="true"
                  >
                    <span className="sr-only">Open user menu</span>
                    <div className="h-8 w-8 rounded-full bg-primary-600 flex items-center justify-center text-white">
                      {userProfile?.display_name ? userProfile.display_name.charAt(0).toUpperCase() :
                       user.email ? user.email.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <span className={`ml-2 ${textColor}`}>{userProfile?.display_name || user.email}</span>
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
                    <Link href="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" role="menuitem">
                      Your Profile
                    </Link>
                    <Link href="/messages" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" role="menuitem">
                      Messages
                    </Link>
                    <Link href="/counseling/sessions" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" role="menuitem">
                      Your Sessions
                    </Link>

                    {userRole === 'counselor' && (
                      <Link href="/counselor" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" role="menuitem">
                        Counselor Dashboard
                      </Link>
                    )}

                    {userRole === 'admin' && (
                      <Link href="/admin" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" role="menuitem">
                        Admin Dashboard
                      </Link>
                    )}

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
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  href="/account/signin"
                  className={`px-4 py-2 text-sm font-medium ${textColor} hover:text-primary-600 transition-colors`}
                >
                  Sign In
                </Link>
                <Link
                  href="/account/signup"
                  className="px-4 py-2 text-sm font-medium rounded-xl bg-primary-600 text-white hover:bg-primary-700 transition-colors"
                >
                  Sign Up
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <div className="flex md:hidden ml-4">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className={`inline-flex items-center justify-center p-2 rounded-md ${textColor} hover:text-primary-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500`}
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
        <div className="md:hidden bg-white shadow-lg animate-slide-in-right">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link href="/home" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50">
              Home
            </Link>
            <Link href="/mental-health-checkin" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50">
              Daily Check-in
            </Link>
            <Link href="/book-session" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50">
              Book a Session
            </Link>
            <Link href="/community" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50">
              Community
            </Link>

            {user && (
              <Link href="/messages" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50">
                Messages
              </Link>
            )}

            {userRole === 'counselor' && (
              <Link href="/counselor" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50">
                Counselor Dashboard
              </Link>
            )}

            {userRole === 'admin' && (
              <Link href="/admin" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50">
                Admin Dashboard
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
