"use client";
import React from 'react';
import Link from 'next/link';
import { GlassCard } from '@/components/ui/ModernUI';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';

export default function CopingStrategiesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <Link 
            href="/#resources" 
            className="inline-flex items-center text-green-600 hover:text-green-800 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Resources
          </Link>
        </div>
        
        <h1 className="text-4xl font-bold text-gray-900 mb-6 font-heading">Coping Strategies</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <GlassCard className="p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Effective Coping Mechanisms</h2>
              <p className="text-gray-700 mb-4">
                Coping strategies are the specific efforts, both behavioral and psychological, that people employ to master, tolerate, reduce, or minimize stressful events. Learning healthy ways to cope and getting the right care are essential for improving your mental health.
              </p>
              <p className="text-gray-700 mb-4">
                Different strategies work for different people, and different situations may call for different approaches. It's important to find what works best for you in various circumstances.
              </p>
              <div className="bg-green-50 border-l-4 border-green-500 p-4 my-6">
                <p className="text-green-700">
                  <strong>Remember:</strong> Developing good coping skills takes practice. Be patient with yourself as you learn to manage stress in healthy ways.
                </p>
              </div>
            </GlassCard>
            
            <GlassCard className="p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Healthy Coping Strategies</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">1. Physical Techniques</h3>
                  <ul className="list-disc pl-6 space-y-2 text-gray-700">
                    <li>Deep breathing exercises</li>
                    <li>Progressive muscle relaxation</li>
                    <li>Regular physical exercise</li>
                    <li>Yoga or tai chi</li>
                    <li>Getting adequate sleep</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">2. Mental Techniques</h3>
                  <ul className="list-disc pl-6 space-y-2 text-gray-700">
                    <li>Mindfulness meditation</li>
                    <li>Positive self-talk</li>
                    <li>Challenging negative thoughts</li>
                    <li>Visualization exercises</li>
                    <li>Setting realistic goals</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">3. Emotional Techniques</h3>
                  <ul className="list-disc pl-6 space-y-2 text-gray-700">
                    <li>Journaling feelings and experiences</li>
                    <li>Expressing emotions through art or music</li>
                    <li>Talking with trusted friends or family</li>
                    <li>Practicing self-compassion</li>
                    <li>Engaging in activities that bring joy</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">4. Social Techniques</h3>
                  <ul className="list-disc pl-6 space-y-2 text-gray-700">
                    <li>Building a support network</li>
                    <li>Setting healthy boundaries</li>
                    <li>Asking for help when needed</li>
                    <li>Joining support groups</li>
                    <li>Volunteering or helping others</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">5. Practical Techniques</h3>
                  <ul className="list-disc pl-6 space-y-2 text-gray-700">
                    <li>Time management strategies</li>
                    <li>Breaking large tasks into smaller steps</li>
                    <li>Problem-solving approaches</li>
                    <li>Creating routines and structure</li>
                    <li>Learning to prioritize self-care</li>
                  </ul>
                </div>
              </div>
            </GlassCard>
          </div>
          
          <div className="space-y-8">
            <GlassCard className="p-6 bg-gradient-to-br from-green-500 to-green-600 text-white">
              <h3 className="text-xl font-bold mb-4">Need Additional Support?</h3>
              <p className="mb-4">
                While these strategies can be helpful, sometimes professional support is needed, especially during difficult times.
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
                  className="block w-full bg-white text-green-600 text-center py-2 px-4 rounded-lg font-medium hover:bg-green-50 transition-colors"
                >
                  Book a Session with a Counselor
                </Link>
              </div>
            </GlassCard>
            
            <GlassCard className="p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">The 5-4-3-2-1 Grounding Technique</h3>
              <p className="text-gray-700 mb-4">
                This technique can help during moments of anxiety or overwhelm:
              </p>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <span className="bg-green-100 text-green-800 font-bold rounded-full w-6 h-6 flex items-center justify-center mr-2">5</span>
                  <span className="text-gray-700"><strong>See:</strong> Acknowledge 5 things you can see</span>
                </li>
                <li className="flex items-start">
                  <span className="bg-green-100 text-green-800 font-bold rounded-full w-6 h-6 flex items-center justify-center mr-2">4</span>
                  <span className="text-gray-700"><strong>Touch:</strong> Acknowledge 4 things you can touch</span>
                </li>
                <li className="flex items-start">
                  <span className="bg-green-100 text-green-800 font-bold rounded-full w-6 h-6 flex items-center justify-center mr-2">3</span>
                  <span className="text-gray-700"><strong>Hear:</strong> Acknowledge 3 things you can hear</span>
                </li>
                <li className="flex items-start">
                  <span className="bg-green-100 text-green-800 font-bold rounded-full w-6 h-6 flex items-center justify-center mr-2">2</span>
                  <span className="text-gray-700"><strong>Smell:</strong> Acknowledge 2 things you can smell</span>
                </li>
                <li className="flex items-start">
                  <span className="bg-green-100 text-green-800 font-bold rounded-full w-6 h-6 flex items-center justify-center mr-2">1</span>
                  <span className="text-gray-700"><strong>Taste:</strong> Acknowledge 1 thing you can taste</span>
                </li>
              </ul>
            </GlassCard>
            
            <GlassCard className="p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Related Resources</h3>
              <ul className="space-y-3">
                <li>
                  <Link href="/resources/anxiety" className="text-green-600 hover:text-green-800 transition-colors">
                    Anxiety Management
                  </Link>
                </li>
                <li>
                  <Link href="/resources/depression" className="text-green-600 hover:text-green-800 transition-colors">
                    Depression Resources
                  </Link>
                </li>
                <li>
                  <Link href="/mental-health-checkin" className="text-green-600 hover:text-green-800 transition-colors">
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
