"use client";
import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function ThankYouPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <motion.div 
        className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8 md:p-12 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="mb-8 flex justify-center">
          <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center">
            <svg className="h-10 w-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Application Received!
        </h1>
        
        <p className="text-xl text-gray-600 mb-8">
          Thank you for applying to join our platform as a counselor. We're excited about the possibility of working with you!
        </p>
        
        <div className="bg-blue-50 rounded-xl p-6 mb-8 text-left">
          <h2 className="text-lg font-semibold text-blue-800 mb-3">What happens next?</h2>
          <ol className="space-y-3 text-blue-700">
            <li className="flex items-start">
              <span className="h-6 w-6 rounded-full bg-blue-200 flex items-center justify-center mr-3 flex-shrink-0 mt-0.5">1</span>
              <span>Our team will review your application within 2-3 business days.</span>
            </li>
            <li className="flex items-start">
              <span className="h-6 w-6 rounded-full bg-blue-200 flex items-center justify-center mr-3 flex-shrink-0 mt-0.5">2</span>
              <span>You'll receive an email with the status of your application.</span>
            </li>
            <li className="flex items-start">
              <span className="h-6 w-6 rounded-full bg-blue-200 flex items-center justify-center mr-3 flex-shrink-0 mt-0.5">3</span>
              <span>If approved, we'll guide you through setting up your counselor profile and scheduling availability.</span>
            </li>
          </ol>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link 
            href="/" 
            className="px-6 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors"
          >
            Return to Home
          </Link>
          <Link 
            href="/contact" 
            className="px-6 py-3 rounded-lg bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300 transition-colors"
          >
            Contact Support
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
