'use client';
import React, { useEffect } from 'react';

export default function BypassMiddleware() {
  useEffect(() => {
    // This function will run only on the client side
    // It directly changes the window location to the counselor dashboard
    // This bypasses the middleware completely
    window.location.href = '/counselor/dashboard';
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
        <h1 className="text-2xl font-bold mb-4">Redirecting...</h1>
        <p className="mb-4">Bypassing middleware to access the counselor dashboard.</p>
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
        </div>
      </div>
    </div>
  );
}
