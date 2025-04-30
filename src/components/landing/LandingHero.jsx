"use client";
import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function LandingHero() {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-800 text-white">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <svg className="h-full w-full" viewBox="0 0 800 800" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
              <path d="M 50 0 L 0 0 0 50" fill="none" stroke="white" strokeWidth="1" opacity="0.3" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>
      
      {/* Decorative circles */}
      <div className="absolute top-0 right-0 -mt-24 -mr-24 h-96 w-96 rounded-full bg-blue-500 opacity-20 blur-3xl"></div>
      <div className="absolute bottom-0 left-0 -mb-24 -ml-24 h-96 w-96 rounded-full bg-indigo-600 opacity-20 blur-3xl"></div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-36">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div 
            className="text-center lg:text-left"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-block px-4 py-1 rounded-full bg-white/10 backdrop-blur-sm text-white text-sm font-medium mb-4">
              Mental Health Support Platform
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              Take a Step Toward <span className="text-blue-300">Feeling Better</span>
            </h1>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto lg:mx-0">
              Talk to a counselor, check in with yourself, or connect with others who care. Your journey to better mental health starts here.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link 
                href="/account/signup" 
                className="px-8 py-3 rounded-xl bg-white text-blue-700 font-semibold hover:bg-blue-50 transition-colors shadow-lg shadow-blue-900/20 text-center"
              >
                Sign Up Free
              </Link>
              <Link 
                href="/account/signin" 
                className="px-8 py-3 rounded-xl bg-blue-700/30 backdrop-blur-sm text-white font-semibold hover:bg-blue-700/50 transition-colors border border-white/20 text-center"
              >
                Sign In
              </Link>
            </div>
            
            <p className="mt-4 text-blue-200 text-sm">
              No credit card required. Start your journey today.
            </p>
          </motion.div>
          
          <motion.div
            className="hidden lg:block"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-indigo-600/20 rounded-3xl blur-xl transform scale-95"></div>
              <img
                src="/images/hero-illustration.svg"
                alt="Mental health support illustration"
                className="relative z-10 w-full h-auto max-w-lg mx-auto"
              />
            </div>
          </motion.div>
        </div>
        
        {/* Trust indicators */}
        <motion.div 
          className="mt-16 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <p className="text-blue-200 mb-6">Trusted by thousands of people on their mental health journey</p>
          <div className="flex flex-wrap justify-center gap-8 items-center">
            <div className="flex items-center">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className={`h-10 w-10 rounded-full bg-blue-${i+3}00 flex items-center justify-center text-white border-2 border-blue-800`}>
                    <span className="text-xs">U{i}</span>
                  </div>
                ))}
              </div>
              <div className="ml-4 text-left">
                <p className="text-white font-medium">4.9/5 stars</p>
                <p className="text-blue-200 text-sm">from 500+ reviews</p>
              </div>
            </div>
            <div className="h-12 w-px bg-blue-700/50 hidden md:block"></div>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-white text-2xl font-bold">10,000+</p>
                <p className="text-blue-200 text-sm">Daily Check-ins</p>
              </div>
              <div className="text-center">
                <p className="text-white text-2xl font-bold">5,000+</p>
                <p className="text-blue-200 text-sm">Active Members</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
      
      {/* Wave divider */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" className="w-full h-auto">
          <path
            fill="#ffffff"
            fillOpacity="1"
            d="M0,192L60,197.3C120,203,240,213,360,208C480,203,600,181,720,181.3C840,181,960,203,1080,208C1200,213,1320,203,1380,197.3L1440,192L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z"
          ></path>
        </svg>
      </div>
    </div>
  );
}
