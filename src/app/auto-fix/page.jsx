"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabaseClient';

export default function AutoFixPage() {
  const [status, setStatus] = useState('fixing');
  const [message, setMessage] = useState('Automatically fixing authentication...');
  const router = useRouter();
  
  useEffect(() => {
    const autoFix = async () => {
      try {
        // Step 1: Check if user is authenticated
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          // Redirect to sign in page
          router.push('/account/signin?redirect=/messages');
          return;
        }
        
        // Step 2: Fix RLS policies
        await fetch('/api/auth/fix-rls');
        
        // Step 3: Redirect to messages page
        setStatus('success');
        setMessage('Authentication fixed! Redirecting...');
        
        // Redirect after a short delay
        setTimeout(() => {
          router.push('/messages');
        }, 1000);
      } catch (error) {
        console.error('Error in auto-fix:', error);
        setStatus('error');
        setMessage('Error fixing authentication. Redirecting to messages anyway...');
        
        // Still redirect after a delay
        setTimeout(() => {
          router.push('/messages');
        }, 2000);
      }
    };
    
    autoFix();
  }, [router]);
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4 flex flex-col items-center justify-center">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Authentication Fix</h1>
        
        {status === 'fixing' && (
          <div className="flex flex-col items-center justify-center">
            <div className="animate-spin h-12 w-12 rounded-full border-t-2 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-gray-600">{message}</p>
          </div>
        )}
        
        {status === 'success' && (
          <div className="flex flex-col items-center justify-center">
            <div className="bg-green-100 text-green-500 rounded-full p-3 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-green-600 font-medium">{message}</p>
          </div>
        )}
        
        {status === 'error' && (
          <div className="flex flex-col items-center justify-center">
            <div className="bg-red-100 text-red-500 rounded-full p-3 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <p className="text-red-600 font-medium">{message}</p>
          </div>
        )}
      </div>
    </div>
  );
}
