"use client";
import React from 'react';
import Link from 'next/link';
import { GlassCard } from '@/components/ui/ModernUI';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';

export default function DepressionResourcesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <Link 
            href="/#resources" 
            className="inline-flex items-center text-purple-600 hover:text-purple-800 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Resources
          </Link>
        </div>
        
        <h1 className="text-4xl font-bold text-gray-900 mb-6 font-heading">Depression Resources</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <GlassCard className="p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Understanding Depression</h2>
              <p className="text-gray-700 mb-4">
                Depression (major depressive disorder) is a common and serious medical illness that negatively affects how you feel, the way you think, and how you act. It can lead to a variety of emotional and physical problems and can decrease your ability to function at work and at home.
              </p>
              <p className="text-gray-700 mb-4">
                Depression is more than just feeling sad or going through a rough patch. It's a serious mental health condition that requires understanding and medical care. Left untreated, depression can be devastating for those who have it and their families.
              </p>
              <div className="bg-purple-50 border-l-4 border-purple-500 p-4 my-6">
                <p className="text-purple-700">
                  <strong>Important:</strong> Depression is among the most treatable of mental disorders. Between 80% and 90% of people with depression eventually respond well to treatment.
                </p>
              </div>
            </GlassCard>
            
            <GlassCard className="p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Strategies for Managing Depression</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">1. Seek Professional Help</h3>
                  <p className="text-gray-700">
                    Depression is a medical condition that often requires professional treatment. Consider talking to a mental health professional who can provide therapy, medication, or a combination of both.
                  </p>
                </div>
                
                <div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">2. Stay Connected</h3>
                  <p className="text-gray-700">
                    Reach out to trusted friends and family. Social isolation can worsen depression, while maintaining connections can provide support and perspective.
                  </p>
                </div>
                
                <div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">3. Establish Routine</h3>
                  <p className="text-gray-700">
                    Create a daily schedule that includes regular sleep patterns, meals, physical activity, and social time. Structure can help combat the lethargy and disorganization that often accompany depression.
                  </p>
                </div>
                
                <div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">4. Set Small Goals</h3>
                  <p className="text-gray-700">
                    When you're depressed, tasks can seem overwhelming. Break them down into small, manageable steps and acknowledge your achievements, no matter how small.
                  </p>
                </div>
                
                <div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">5. Challenge Negative Thoughts</h3>
                  <p className="text-gray-700">
                    Depression often involves distorted thinking. Practice identifying negative thoughts and challenging them with more balanced perspectives.
                  </p>
                </div>
              </div>
            </GlassCard>
          </div>
          
          <div className="space-y-8">
            <GlassCard className="p-6 bg-gradient-to-br from-purple-500 to-purple-600 text-white">
              <h3 className="text-xl font-bold mb-4">Need Immediate Support?</h3>
              <p className="mb-4">
                If you're experiencing severe depression or having thoughts of self-harm, please reach out for help immediately.
              </p>
              <div className="space-y-3">
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span>National Suicide Prevention Lifeline: 988</span>
                </div>
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span>Crisis Text Line: Text HOME to 741741</span>
                </div>
              </div>
              <div className="mt-6">
                <Link 
                  href="/book-session" 
                  className="block w-full bg-white text-purple-600 text-center py-2 px-4 rounded-lg font-medium hover:bg-purple-50 transition-colors"
                >
                  Book a Session with a Counselor
                </Link>
              </div>
            </GlassCard>
            
            <GlassCard className="p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Self-Care Practices</h3>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">Engage in regular physical activity</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">Maintain a balanced diet</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">Practice mindfulness or meditation</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">Ensure adequate sleep</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">Engage in activities you once enjoyed</span>
                </li>
              </ul>
            </GlassCard>
            
            <GlassCard className="p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Related Resources</h3>
              <ul className="space-y-3">
                <li>
                  <Link href="/resources/anxiety" className="text-purple-600 hover:text-purple-800 transition-colors">
                    Anxiety Management
                  </Link>
                </li>
                <li>
                  <Link href="/resources/coping" className="text-purple-600 hover:text-purple-800 transition-colors">
                    Coping Strategies
                  </Link>
                </li>
                <li>
                  <Link href="/mental-health-checkin" className="text-purple-600 hover:text-purple-800 transition-colors">
                    Daily Mental Health Check-in
                  </Link>
                </li>
              </ul>
            </GlassCard>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}
