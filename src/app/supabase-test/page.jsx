'use client';

import { Suspense } from 'react';
import SupabaseTest from '@/components/SupabaseTest';

export default function SupabaseTestPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold text-center mb-6">Supabase Connection Test</h1>
        
        <Suspense fallback={<div className="text-center">Loading...</div>}>
          <SupabaseTest />
        </Suspense>
        
        <div className="mt-8 text-center">
          <a 
            href="/"
            className="text-blue-600 hover:text-blue-800 underline"
          >
            Back to Home
          </a>
        </div>
      </div>
    </div>
  );
}
