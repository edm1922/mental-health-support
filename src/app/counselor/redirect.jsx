"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/utils/useUser';

export default function CounselorRedirect() {
  const router = useRouter();
  const { data: user, loading, role } = useUser();

  useEffect(() => {
    const redirectUser = async () => {
      console.log("Counselor redirect - user:", user?.id, "role:", role, "loading:", loading);

      if (loading) return;

      if (!user) {
        console.log("No user found, redirecting to sign in");
        router.push('/signin?redirect=/counselor/dashboard');
        return;
      }

      // Check if user is a counselor
      console.log("Checking if user is a counselor:", user);

      // Try all possible ways to check if user is a counselor
      const isCounselor =
        role === 'counselor' ||
        user.role === 'counselor' ||
        (user.profile && user.profile.role === 'counselor');

      console.log("Is counselor:", isCounselor);

      if (isCounselor) {
        console.log("User is a counselor, redirecting to dashboard");
        router.push('/counselor-dashboard');
      } else {
        console.log("User is not a counselor, redirecting to home");
        router.push('/home');
      }
    };

    redirectUser();
  }, [user, loading, role, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-green-500 mx-auto"></div>
        <p className="mt-6 text-gray-600 font-medium">Redirecting to counselor dashboard...</p>
      </div>
    </div>
  );
}
