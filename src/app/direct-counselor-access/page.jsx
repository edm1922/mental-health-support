"use client";
import { useEffect } from 'react';
import { supabase } from '@/utils/supabaseClient';

export default function DirectCounselorAccess() {
  useEffect(() => {
    const directAccess = async () => {
      try {
        // Get the current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('Session error:', sessionError);
          window.location.href = '/account/signin';
          return;
        }

        if (!session) {
          console.log('No session found, redirecting to sign-in');
          window.location.href = '/account/signin';
          return;
        }

        // Get the user's role
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();

        if (profileError) {
          console.error('Error fetching profile:', profileError);
          window.location.href = '/account/signin';
          return;
        }

        if (profile.role !== 'counselor') {
          console.log('User is not a counselor, redirecting to home');
          window.location.href = '/home';
          return;
        }

        // User is a counselor, redirect to the counselor dashboard
        // Use a special flag to prevent redirect loops
        console.log('User is a counselor, redirecting to counselor dashboard with no-redirect flag');
        window.location.href = '/counselor/dashboard/direct?no_redirect=true';
      } catch (error) {
        console.error('Error in direct access:', error);
        window.location.href = '/account/signin';
      }
    };

    directAccess();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-transparent mx-auto"></div>
        <p className="mt-4 text-gray-600">Redirecting to counselor dashboard...</p>
      </div>
    </div>
  );
}
