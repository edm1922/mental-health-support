"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabaseClient';

export default function AutoAuthFixWrapper() {
  // Use state to track if we're on the client
  const [isClient, setIsClient] = useState(false);
  const [fixed, setFixed] = useState(false);

  // Use useEffect to set isClient to true after mount
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Handle auth fix in this component directly
  useEffect(() => {
    if (!isClient || fixed) return;

    const fixAuth = async () => {
      try {
        // Skip auth fix on sign-in and sign-up pages
        const isAuthPage = window.location.pathname.includes('/account/signin') ||
                          window.location.pathname.includes('/account/signup');

        if (isAuthPage) {
          console.log('Skipping auth fix on auth page');
          setFixed(true);
          return;
        }

        // Check if user is authenticated
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          // Not authenticated, nothing to fix
          setFixed(true);
          return;
        }

        // Check if user profile exists
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('id, role')
          .eq('id', session.user.id)
          .maybeSingle();

        if (profileError && profileError.code !== 'PGRST116') {
          console.error('Error checking profile:', profileError);
        }

        // If no profile exists, create one
        if (!profile) {
          console.log('Creating profile for user:', session.user.id);

          const displayName = session.user.user_metadata?.name ||
                              session.user.email?.split('@')[0] ||
                              'User';

          const { error: createError } = await supabase
            .from('user_profiles')
            .insert({
              id: session.user.id,
              display_name: displayName,
              role: 'user',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });

          if (createError) {
            console.error('Error creating profile:', createError);
          } else {
            console.log('Profile created successfully');
          }
        } else {
          // If user is on the wrong page for their role, redirect them
          const currentPath = window.location.pathname;

          // Redirect counselors to counselor dashboard if they're on the home page
          if (profile.role === 'counselor' && currentPath === '/home') {
            console.log('Redirecting counselor to dashboard');
            window.location.href = '/counselor/dashboard';
            return;
          }

          // Redirect admins to admin dashboard if they're on the home page
          if (profile.role === 'admin' && currentPath === '/home') {
            console.log('Redirecting admin to dashboard');
            window.location.href = '/admin/dashboard';
            return;
          }
        }

        setFixed(true);
      } catch (error) {
        console.error('Error in AutoAuthFix:', error);
        setFixed(true); // Mark as fixed anyway to prevent infinite retries
      }
    };

    fixAuth();
  }, [isClient, fixed]);

  // This component doesn't render anything visible
  return null;
}
