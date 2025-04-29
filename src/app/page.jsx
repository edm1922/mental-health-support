"use client";
import React, { useEffect, useState } from "react";
import { useUser } from '../utils/useUser';
import { useAuth } from '../utils/useAuth';
import { supabase } from '../utils/supabaseClient';
import CounselorSection, { CounselorApplicationSection } from '../components/CounselorSection';
import RoleBasedActionCards from '../components/RoleBasedActionCards';
import RoleBasedRedirect from '../components/RoleBasedRedirect';
import DatabaseSchemaCheck from '../components/DatabaseSchemaCheck';
import QuotePopupProvider from '../components/QuotePopupProvider';
import { useRouter } from 'next/navigation';
import Navbar from '../components/ui/Navbar';
import Hero from '../components/ui/Hero';
import Footer from '../components/ui/Footer';
import { Button } from '../components/ui/Button';

function MainComponent() {
  const router = useRouter();
  const { data: user } = useUser();
  const { signOut } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  // Track scroll position for animations
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    async function loadProfile() {
      if (user) {
        try {
          console.log('Home page: User is authenticated, ID:', user.id);

          // Get the current auth token
          const { data: { session } } = await supabase.auth.getSession();
          const token = session?.access_token;

          if (!token) {
            console.error('No access token available');
            return;
          }

          console.log('Home page: Session token available');

          // Get user profile directly from Supabase
          const { data: profileData, error: profileError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', user.id)
            .single();

          if (profileError) {
            console.error('Error fetching profile from Supabase:', profileError);

            // Fallback to API endpoint
            console.log('Home page: Falling back to API endpoint');
            const response = await fetch("/api/get-basic-profile", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
              },
            });

            if (response.ok) {
              const data = await response.json();
              console.log('Profile data loaded from API:', data);
              setProfileData(data);
            } else {
              const errorData = await response.json();
              throw new Error(errorData.error || "Failed to load profile");
            }
          } else {
            console.log('Profile data loaded from Supabase:', profileData);
            setProfileData(profileData);
          }

          // Update last_active timestamp (non-blocking)
          fetch("/api/update-last-active", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`
            },
          }).catch(err => {
            console.warn('Error updating last active timestamp:', err);
          });

          // Authentication successful, user will be redirected based on role
          console.log('Home page: Authentication successful, user will be redirected based on role');
        } catch (error) {
          console.error("Error loading profile:", error);
        }
      } else {
        console.log('Home page: No authenticated user');
      }
    }
    loadProfile();
  }, [user, router]);

  const handleSignOut = async () => {
    await signOut({
      callbackUrl: "/",
      redirect: true,
    });
  };

  const getAuthenticatedLink = (path) => {
    return user ? path : `/account/signin?callbackUrl=${path}`;
  };

  // Activate reveal animations on scroll
  useEffect(() => {
    const handleRevealElements = () => {
      const reveals = document.querySelectorAll('.reveal');

      reveals.forEach(element => {
        const elementTop = element.getBoundingClientRect().top;
        const elementVisible = 150;

        if (elementTop < window.innerHeight - elementVisible) {
          element.classList.add('active');
        }
      });
    };

    window.addEventListener('scroll', handleRevealElements);
    handleRevealElements(); // Initial check

    return () => window.removeEventListener('scroll', handleRevealElements);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Role-based redirect component - redirects authenticated users to their dashboard */}
      <RoleBasedRedirect />

      {/* Database schema check component - runs on page load */}
      <DatabaseSchemaCheck />

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
        {/* Counselor Section - Only visible to counselors */}
        <CounselorSection />

        {/* Counselor Application Section - Only visible to non-counselors */}
        <CounselorApplicationSection />

        {/* Role-based action cards */}
        <RoleBasedActionCards userRole={profileData?.role || 'user'} />

        {/* Role-based action cards will handle navigation */}

        {/* Mental Health Resources Section */}
        <div id="resources" className="py-16 reveal">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center font-heading">
            Mental Health Resources
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-blue-50/70 rounded-2xl shadow-soft p-6 transition-all duration-300 hover:shadow-xl hover:scale-[1.03] group reveal" style={{ transitionDelay: '0.1s' }}>
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 text-primary-600 transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-primary-100/50 group-hover:bg-primary-200">
                <svg className="h-6 w-6 transition-transform duration-300 group-hover:rotate-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3 font-heading transition-colors duration-300 group-hover:text-primary-700">
                Anxiety Management
              </h3>
              <p className="text-gray-600 transition-colors duration-300 group-hover:text-gray-700">
                Learn techniques to manage anxiety and reduce stress in daily life.
              </p>
              <Button href="/resources/anxiety" variant="link" className="mt-4 transition-all duration-300 group-hover:translate-x-1">
                Learn more
              </Button>
            </div>

            <div className="bg-purple-50/70 rounded-2xl shadow-soft p-6 transition-all duration-300 hover:shadow-xl hover:scale-[1.03] group reveal" style={{ transitionDelay: '0.2s' }}>
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-secondary-100 text-secondary-600 transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-secondary-100/50 group-hover:bg-secondary-200">
                <svg className="h-6 w-6 transition-transform duration-300 group-hover:rotate-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3 font-heading transition-colors duration-300 group-hover:text-secondary-700">
                Depression Resources
              </h3>
              <p className="text-gray-600 transition-colors duration-300 group-hover:text-gray-700">
                Find support and strategies for dealing with depression.
              </p>
              <Button href="/resources/depression" variant="link" className="mt-4 transition-all duration-300 group-hover:translate-x-1">
                Learn more
              </Button>
            </div>

            <div className="bg-green-50/70 rounded-2xl shadow-soft p-6 transition-all duration-300 hover:shadow-xl hover:scale-[1.03] group reveal" style={{ transitionDelay: '0.3s' }}>
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-accent-100 text-accent-600 transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-accent-100/50 group-hover:bg-accent-200">
                <svg className="h-6 w-6 transition-transform duration-300 group-hover:rotate-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3 font-heading transition-colors duration-300 group-hover:text-accent-700">
                Coping Strategies
              </h3>
              <p className="text-gray-600 transition-colors duration-300 group-hover:text-gray-700">
                Discover effective techniques for managing stress and anxiety.
              </p>
              <Button href="/resources/coping" variant="link" className="mt-4 transition-all duration-300 group-hover:translate-x-1">
                Learn more
              </Button>
            </div>
          </div>
        </div>

        {/* Testimonials Section */}
        <div className="py-16 reveal">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center font-heading">
            What Our Users Say
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-gradient-to-br from-primary-50 to-secondary-50 rounded-2xl shadow-soft p-8 reveal" style={{ transitionDelay: '0.1s' }}>
              <div className="flex items-center mb-4">
                <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 mr-4">
                  <span className="text-lg font-bold">S</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Sarah M.</h4>
                  <p className="text-sm text-gray-600">User for 6 months</p>
                </div>
              </div>
              <p className="text-gray-700 italic">
                "The daily check-ins have helped me become more aware of my emotional patterns. The counselors are supportive and professional. I'm grateful for this platform."
              </p>
            </div>

            <div className="bg-gradient-to-br from-secondary-50 to-accent-50 rounded-2xl shadow-soft p-8 reveal" style={{ transitionDelay: '0.2s' }}>
              <div className="flex items-center mb-4">
                <div className="h-12 w-12 rounded-full bg-secondary-100 flex items-center justify-center text-secondary-600 mr-4">
                  <span className="text-lg font-bold">J</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">James T.</h4>
                  <p className="text-sm text-gray-600">User for 3 months</p>
                </div>
              </div>
              <p className="text-gray-700 italic">
                "Finding a counselor who understands my specific challenges was easy with this platform. The community forum has also been a great source of support."
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modern Footer */}
      <Footer />

      {/* Quote Popup */}
      <QuotePopupProvider />
    </div>
  );
}

export default MainComponent;