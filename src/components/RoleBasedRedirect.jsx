'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabaseClient';
import { useRouter } from 'next/navigation';

export default function RoleBasedRedirect() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function checkAuthAndRedirect() {
      try {
        console.log('RoleBasedRedirect: Checking authentication status');

        // Get current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('RoleBasedRedirect: Session error:', sessionError);
          setError(sessionError.message);
          return;
        }

        if (!session) {
          console.log('RoleBasedRedirect: No active session, staying on current page');
          setLoading(false);
          return;
        }

        console.log('RoleBasedRedirect: User authenticated, ID:', session.user.id);

        // Get user profile to determine role
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();

        if (profileError) {
          console.error('RoleBasedRedirect: Error fetching profile:', profileError);
          setError(profileError.message);
          return;
        }

        if (!profile) {
          console.log('RoleBasedRedirect: No profile found for user');
          setLoading(false);
          return;
        }

        console.log('RoleBasedRedirect: User role:', profile.role);

        // Redirect based on role
        if (profile.role === 'admin') {
          console.log('RoleBasedRedirect: Redirecting admin to admin dashboard');
          router.push('/admin/dashboard');
        } else if (profile.role === 'counselor') {
          console.log('RoleBasedRedirect: Redirecting counselor to counselor dashboard');
          router.push('/counselor/dashboard');
        } else if (profile.role === 'user') {
          console.log('RoleBasedRedirect: Redirecting user to profile page');
          router.push('/profile');
        } else {
          console.log('RoleBasedRedirect: Unknown role, staying on current page');
          setLoading(false);
        }
      } catch (err) {
        console.error('RoleBasedRedirect: Error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    checkAuthAndRedirect();
  }, [router]);

  // This component doesn't render anything visible
  return null;
}
