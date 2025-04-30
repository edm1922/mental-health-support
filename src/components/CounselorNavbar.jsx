"use client";
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUser } from '@/utils/useUser';
import { supabase } from '@/utils/supabaseClient';

export default function CounselorNavbar() {
  const pathname = usePathname();
  const { data: user } = useUser();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  const navItems = [
    { name: 'Dashboard', href: '/counselor/dashboard' },
    { name: 'My Sessions', href: '/counselor/sessions' },
    { name: 'Patient Check-ins', href: '/counselor/check-ins' },
    { name: 'My Profile', href: '/counselor/my-profile' },
  ];

  return (
    <nav className="bg-green-800 text-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between p-4">
        <div className="flex items-center">
          <Link href="/counselor/dashboard" className="text-xl font-bold">
            Counselor Portal
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex md:items-center md:space-x-6">
          {navItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`px-3 py-2 text-sm font-medium ${
                pathname === item.href
                  ? 'bg-green-700 text-white'
                  : 'text-white hover:bg-green-700'
              } rounded-md transition-colors`}
            >
              {item.name}
            </Link>
          ))}
          <Link
            href="/"
            className="px-3 py-2 text-sm font-medium text-white hover:bg-green-700 rounded-md transition-colors"
          >
            Back to Site
          </Link>
          <button
            onClick={handleSignOut}
            className="px-3 py-2 text-sm font-medium text-white hover:bg-green-700 rounded-md transition-colors"
          >
            Sign Out
          </button>
          <div className="ml-4 flex items-center">
            <div className="h-8 w-8 rounded-full bg-green-600 flex items-center justify-center">
              {user?.email?.charAt(0).toUpperCase() || 'C'}
            </div>
            <span className="ml-2 text-sm">{user?.email || 'counselor1@example.com'}</span>
          </div>
        </div>

        {/* Mobile menu button */}
        <div className="flex md:hidden">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="inline-flex items-center justify-center rounded-md p-2 text-white hover:bg-green-700 focus:outline-none"
          >
            <span className="sr-only">Open main menu</span>
            {isMenuOpen ? (
              <svg
                className="h-6 w-6"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg
                className="h-6 w-6"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="space-y-1 px-2 pb-3 pt-2">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`block px-3 py-2 text-base font-medium ${
                  pathname === item.href
                    ? 'bg-green-700 text-white'
                    : 'text-white hover:bg-green-700'
                } rounded-md`}
                onClick={() => setIsMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
            <Link
              href="/"
              className="block px-3 py-2 text-base font-medium text-white hover:bg-green-700 rounded-md"
              onClick={() => setIsMenuOpen(false)}
            >
              Back to Site
            </Link>
            <button
              onClick={handleSignOut}
              className="block w-full text-left px-3 py-2 text-base font-medium text-white hover:bg-green-700 rounded-md"
            >
              Sign Out
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
