"use client";
import React from 'react';
import Link from 'next/link';
import { GlassCard } from '@/components/ui/ModernUI';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';

export default function AnxietyResourcesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <Link 
            href="/#resources" 
            className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Resources
          </Link>
        </div>
        
        <h1 className="text-4xl font-bold text-gray-900 mb-6 font-heading">Anxiety Management</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <GlassCard className="p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Understanding Anxiety</h2>
              <p className="text-gray-700 mb-4">
                Anxiety is a normal and often healthy emotion. However, when a person regularly feels disproportionate levels of anxiety, it might become a medical disorder. Anxiety disorders form a category of mental health diagnoses that lead to excessive nervousness, fear, apprehension, and worry.
              </p>
              <p className="text-gray-700 mb-4">
                These disorders alter how a person processes emotions and behave, also causing physical symptoms. Mild anxiety might be vague and unsettling, while severe anxiety may seriously affect day-to-day living.
              </p>
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 my-6">
                <p className="text-blue-700">
                  <strong>Did you know?</strong> Anxiety disorders are the most common form of emotional disorder and can affect anyone at any age.
                </p>
              </div>
            </GlassCard>
            
            <GlassCard className="p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Effective Techniques for Managing Anxiety</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">1. Deep Breathing Exercises</h3>
                  <p className="text-gray-700">
                    Deep breathing activates the parasympathetic nervous system, which helps reduce the stress response. Try the 4-7-8 technique: inhale for 4 seconds, hold for 7 seconds, and exhale for 8 seconds.
                  </p>
                </div>
                
                <div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">2. Progressive Muscle Relaxation</h3>
                  <p className="text-gray-700">
                    Tense each muscle group for 5 seconds, then relax for 30 seconds, and repeat. Start from your toes and work up to your head.
                  </p>
                </div>
                
                <div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">3. Mindfulness Meditation</h3>
                  <p className="text-gray-700">
                    Focus on the present moment without judgment. Start with just 5 minutes a day and gradually increase the duration.
                  </p>
                </div>
                
                <div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">4. Cognitive Restructuring</h3>
                  <p className="text-gray-700">
                    Identify negative thought patterns and challenge them with evidence-based thinking. Ask yourself: "What's the evidence for and against this thought?"
                  </p>
                </div>
                
                <div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">5. Regular Physical Exercise</h3>
                  <p className="text-gray-700">
                    Even 30 minutes of moderate exercise can significantly reduce anxiety levels by releasing endorphins and improving sleep quality.
                  </p>
                </div>
              </div>
            </GlassCard>
          </div>
          
          <div className="space-y-8">
            <GlassCard className="p-6 bg-gradient-to-br from-blue-500 to-blue-600 text-white">
              <h3 className="text-xl font-bold mb-4">Need Immediate Support?</h3>
              <p className="mb-4">
                If you're experiencing severe anxiety or having a panic attack, consider reaching out for professional help.
              </p>
              <div className="space-y-3">
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span>Crisis Text Line: Text HOME to 741741</span>
                </div>
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span>National Suicide Prevention Lifeline: 988</span>
                </div>
              </div>
              <div className="mt-6">
                <Link 
                  href="/book-session" 
                  className="block w-full bg-white text-blue-600 text-center py-2 px-4 rounded-lg font-medium hover:bg-blue-50 transition-colors"
                >
                  Book a Session with a Counselor
                </Link>
              </div>
            </GlassCard>
            
            <GlassCard className="p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Daily Practices</h3>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">Set aside 10 minutes for mindfulness each day</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">Keep a worry journal to track triggers</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">Practice the 5-4-3-2-1 grounding technique</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">Limit caffeine and alcohol consumption</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">Prioritize 7-9 hours of quality sleep</span>
                </li>
              </ul>
            </GlassCard>
            
            <GlassCard className="p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Related Resources</h3>
              <ul className="space-y-3">
                <li>
                  <Link href="/resources/depression" className="text-blue-600 hover:text-blue-800 transition-colors">
                    Depression Resources
                  </Link>
                </li>
                <li>
                  <Link href="/resources/coping" className="text-blue-600 hover:text-blue-800 transition-colors">
                    Coping Strategies
                  </Link>
                </li>
                <li>
                  <Link href="/mental-health-checkin" className="text-blue-600 hover:text-blue-800 transition-colors">
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
