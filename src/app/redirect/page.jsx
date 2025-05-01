'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function RedirectPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState(null);
  const [countdown, setCountdown] = useState(5);
  
  useEffect(() => {
    const redirectTo = searchParams.get('to');
    
    if (!redirectTo) {
      setError('No redirect URL specified');
      return;
    }
    
    console.log('Redirecting to:', redirectTo);
    
    // Start countdown
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          
          // Try different redirection methods
          try {
            // Method 1: Use router.push
            router.push(redirectTo);
            
            // Method 2: Use window.location.href as fallback
            setTimeout(() => {
              console.log('Fallback: Using window.location.href');
              window.location.href = redirectTo;
            }, 500);
          } catch (error) {
            console.error('Error during redirection:', error);
            setError(`Redirection error: ${error.message}`);
          }
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [router, searchParams]);
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full p-8 bg-white rounded-xl shadow-md">
        <h1 className="text-2xl font-bold text-center mb-6">Redirecting...</h1>
        
        {error ? (
          <div className="bg-red-100 text-red-700 p-4 rounded-md mb-4">
            <p>{error}</p>
          </div>
        ) : (
          <>
            <p className="text-center mb-4">
              You will be redirected in {countdown} seconds...
            </p>
            
            <div className="w-full bg-gray-200 rounded-full h-2.5 mb-6">
              <div 
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-1000" 
                style={{ width: `${(countdown / 5) * 100}%` }}
              ></div>
            </div>
            
            <p className="text-center text-sm text-gray-500">
              If you are not redirected automatically, click the button below.
            </p>
            
            <button
              onClick={() => {
                const redirectTo = searchParams.get('to');
                if (redirectTo) {
                  window.location.href = redirectTo;
                }
              }}
              className="w-full mt-4 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md"
            >
              Continue
            </button>
          </>
        )}
      </div>
    </div>
  );
}
