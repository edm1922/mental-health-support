"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CounselorIndex() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the green-themed dashboard page
    router.push('/counselor/dashboard/direct');
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto"></div>
        <p className="mt-4 text-gray-600">Redirecting to counselor dashboard...</p>
      </div>
    </div>
  );
}
