"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabaseClient';

export default function FixAuthPage() {
  const [status, setStatus] = useState('checking');
  const [message, setMessage] = useState('Checking authentication status...');
  const [details, setDetails] = useState(null);
  const [error, setError] = useState(null);
  const router = useRouter();
  
  useEffect(() => {
    const fixAuth = async () => {
      try {
        // Step 1: Check if user is authenticated
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          setStatus('error');
          setMessage('Error checking authentication status');
          setError(sessionError.message);
          return;
        }
        
        if (!session) {
          setStatus('unauthenticated');
          setMessage('You are not logged in');
          return;
        }
        
        setMessage(`Authenticated as ${session.user.email}`);
        
        // Step 2: Create user profile if it doesn't exist
        const response = await fetch('/api/auth/create-profile');
        const data = await response.json();
        
        if (!data.success) {
          setStatus('error');
          setMessage('Error creating user profile');
          setError(data.error);
          return;
        }
        
        setStatus('success');
        setMessage(data.message);
        setDetails(data);
        
        // Wait 3 seconds before redirecting
        setTimeout(() => {
          router.push('/messages');
        }, 3000);
      } catch (err) {
        setStatus('error');
        setMessage('Unexpected error');
        setError(err.message);
      }
    };
    
    fixAuth();
  }, [router]);
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4 flex flex-col items-center justify-center">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Fixing Authentication</h1>
        
        {status === 'checking' && (
          <div className="flex items-center justify-center mb-4">
            <div className="animate-spin h-8 w-8 rounded-full border-t-2 border-b-2 border-blue-500 mr-3"></div>
            <p className="text-gray-600">{message}</p>
          </div>
        )}
        
        {status === 'unauthenticated' && (
          <div className="mb-6">
            <p className="text-gray-600 mb-4">{message}</p>
            <button
              onClick={() => router.push('/account/signin?redirect=/fix-auth')}
              className="w-full rounded-lg bg-blue-500 px-4 py-3 text-white hover:bg-blue-600 transition-colors"
            >
              Sign In
            </button>
          </div>
        )}
        
        {status === 'error' && (
          <div className="mb-6">
            <p className="text-red-600 mb-2">{message}</p>
            <p className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 w-full rounded-lg bg-blue-500 px-4 py-3 text-white hover:bg-blue-600 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}
        
        {status === 'success' && (
          <div className="mb-6">
            <div className="flex items-center mb-4">
              <div className="bg-green-100 text-green-500 rounded-full p-2 mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-green-600 font-medium">{message}</p>
            </div>
            
            {details && (
              <div className="bg-gray-50 p-4 rounded-lg text-sm">
                <h3 className="font-medium text-gray-700 mb-2">Details:</h3>
                <ul className="space-y-2">
                  {details.profile && (
                    <li className="flex items-center">
                      <div className="bg-blue-100 text-blue-500 rounded-full p-1 mr-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <span>Profile created: {details.profile.display_name}</span>
                    </li>
                  )}
                  
                  {details.session && (
                    <li className="flex items-center">
                      <div className="bg-purple-100 text-purple-500 rounded-full p-1 mr-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <span>Test session created</span>
                    </li>
                  )}
                  
                  {details.message && (
                    <li className="flex items-center">
                      <div className="bg-green-100 text-green-500 rounded-full p-1 mr-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                        </svg>
                      </div>
                      <span>Test message created</span>
                    </li>
                  )}
                </ul>
              </div>
            )}
            
            <p className="mt-4 text-center text-gray-600">
              Redirecting to messages in 3 seconds...
            </p>
          </div>
        )}
        
        <div className="mt-4 text-center">
          <button
            onClick={() => router.push('/')}
            className="text-gray-500 hover:text-gray-700"
          >
            Return to Home
          </button>
        </div>
      </div>
    </div>
  );
}
