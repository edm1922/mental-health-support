"use client";
import React from 'react';
import Link from 'next/link';
import { GlassCard } from '@/components/ui/ModernUI';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';

export default function ResourcesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-8 font-heading text-center">Mental Health Resources</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Anxiety Management Card */}
          <Link href="/resources/anxiety" className="block group">
            <GlassCard className="h-full p-6 transition-all duration-300 bg-blue-50/70 border border-blue-200/50 hover:shadow-lg hover:-translate-y-1">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600 transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-blue-100/50 group-hover:bg-blue-200">
                <svg className="h-6 w-6 transition-transform duration-300 group-hover:rotate-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3 font-heading transition-colors duration-300 group-hover:text-blue-700">
                Anxiety Management
              </h3>
              <p className="text-gray-600 transition-colors duration-300 group-hover:text-gray-700">
                Learn techniques to manage anxiety and reduce stress in daily life.
              </p>
              <div className="mt-4 text-blue-600 font-medium group-hover:translate-x-1 transition-transform duration-300 inline-flex items-center">
                Learn more
                <svg className="w-4 h-4 ml-1 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                </svg>
              </div>
            </GlassCard>
          </Link>
          
          {/* Depression Resources Card */}
          <Link href="/resources/depression" className="block group">
            <GlassCard className="h-full p-6 transition-all duration-300 bg-purple-50/70 border border-purple-200/50 hover:shadow-lg hover:-translate-y-1">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 text-purple-600 transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-purple-100/50 group-hover:bg-purple-200">
                <svg className="h-6 w-6 transition-transform duration-300 group-hover:rotate-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3 font-heading transition-colors duration-300 group-hover:text-purple-700">
                Depression Resources
              </h3>
              <p className="text-gray-600 transition-colors duration-300 group-hover:text-gray-700">
                Find support and strategies for dealing with depression.
              </p>
              <div className="mt-4 text-purple-600 font-medium group-hover:translate-x-1 transition-transform duration-300 inline-flex items-center">
                Learn more
                <svg className="w-4 h-4 ml-1 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                </svg>
              </div>
            </GlassCard>
          </Link>
          
          {/* Coping Strategies Card */}
          <Link href="/resources/coping" className="block group">
            <GlassCard className="h-full p-6 transition-all duration-300 bg-green-50/70 border border-green-200/50 hover:shadow-lg hover:-translate-y-1">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600 transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-green-100/50 group-hover:bg-green-200">
                <svg className="h-6 w-6 transition-transform duration-300 group-hover:rotate-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3 font-heading transition-colors duration-300 group-hover:text-green-700">
                Coping Strategies
              </h3>
              <p className="text-gray-600 transition-colors duration-300 group-hover:text-gray-700">
                Discover effective techniques for managing stress and anxiety.
              </p>
              <div className="mt-4 text-green-600 font-medium group-hover:translate-x-1 transition-transform duration-300 inline-flex items-center">
                Learn more
                <svg className="w-4 h-4 ml-1 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                </svg>
              </div>
            </GlassCard>
          </Link>
        </div>
        
        <div className="mt-16">
          <GlassCard className="p-8 bg-gradient-to-br from-indigo-500/10 to-blue-500/10">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 font-heading">Additional Support Options</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                <h3 className="text-xl font-semibold text-gray-800 mb-3">Daily Mental Health Check-in</h3>
                <p className="text-gray-600 mb-4">
                  Track your mood and mental well-being with our daily check-in tool. Identify patterns and monitor your progress over time.
                </p>
                <Link 
                  href="/mental-health-checkin" 
                  className="inline-flex items-center text-blue-600 font-medium hover:text-blue-800 transition-colors"
                >
                  Start a check-in
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                  </svg>
                </Link>
              </div>
              
              <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                <h3 className="text-xl font-semibold text-gray-800 mb-3">Professional Counseling</h3>
                <p className="text-gray-600 mb-4">
                  Connect with licensed mental health professionals for personalized support and guidance through one-on-one sessions.
                </p>
                <Link 
                  href="/book-session" 
                  className="inline-flex items-center text-blue-600 font-medium hover:text-blue-800 transition-colors"
                >
                  Book a session
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                  </svg>
                </Link>
              </div>
              
              <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                <h3 className="text-xl font-semibold text-gray-800 mb-3">Community Support</h3>
                <p className="text-gray-600 mb-4">
                  Join our supportive community forum to connect with others, share experiences, and find encouragement.
                </p>
                <Link 
                  href="/community" 
                  className="inline-flex items-center text-blue-600 font-medium hover:text-blue-800 transition-colors"
                >
                  Join the community
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                  </svg>
                </Link>
              </div>
              
              <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                <h3 className="text-xl font-semibold text-gray-800 mb-3">Crisis Resources</h3>
                <p className="text-gray-600 mb-4">
                  If you're experiencing a mental health crisis, immediate help is available 24/7 through these resources.
                </p>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 mr-2 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span className="text-gray-700">National Suicide Prevention Lifeline: 988</span>
                  </div>
                  <div className="flex items-center">
                    <svg className="w-5 h-5 mr-2 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <span className="text-gray-700">Crisis Text Line: Text HOME to 741741</span>
                  </div>
                </div>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}
