'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabaseClient';
import { useRouter } from 'next/navigation';

/**
 * Component that redirects authenticated users away from auth pages
 * This is a more direct approach to ensure users don't see the sign-in page when already logged in
 */
export default function AuthRedirect() {
  const [isChecking, setIsChecking] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      try {
        // Check if we're in the middle of a sign-in process
        const isSigningIn = sessionStorage.getItem('is_signing_in');
        if (isSigningIn === 'true') {
          console.log('Currently in sign-in process, skipping redirect');
          sessionStorage.removeItem('is_signing_in');
          setIsChecking(false);
          return;
        }

        // Check if we've redirected recently to prevent loops
        const lastRedirect = sessionStorage.getItem('last_redirect_time');
        if (lastRedirect) {
          const timeSinceRedirect = Date.now() - parseInt(lastRedirect);
          if (timeSinceRedirect < 3000) { // 3 seconds
            console.log('Redirected recently, skipping to prevent loop');
            setIsChecking(false);
            return;
          }
        }

        // Check if user is authenticated
        const { data } = await supabase.auth.getSession();

        if (data?.session) {
          // Get user profile to determine where to redirect
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('role')
            .eq('id', data.session.user.id)
            .single();

          // Determine redirect URL based on role
          let redirectUrl = '/home'; // Default redirect

          if (profile) {
            if (profile.role === 'counselor') {
              redirectUrl = '/counselor/dashboard';
            } else if (profile.role === 'admin') {
              redirectUrl = '/admin/dashboard';
            }
          }

          // Set timestamp to prevent redirect loops
          sessionStorage.setItem('last_redirect_time', Date.now().toString());

          // Use window.location for a hard redirect
          window.location.href = redirectUrl;
        } else {
          setIsChecking(false);
        }
      } catch (err) {
        console.error('Error in AuthRedirect:', err);
        setIsChecking(false);
      }
    };

    checkAuthAndRedirect();
  }, []);

  // Return null - this component doesn't render anything
  return null;
}
