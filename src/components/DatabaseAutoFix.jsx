'use client';

import { useEffect, useState } from 'react';
import { autoFixDatabaseIfNeeded } from '@/utils/autoFixDatabase';
import { useUser } from '@/utils/useUser';
import { supabase } from '@/utils/supabaseClient';

/**
 * Component that automatically checks and fixes database issues
 * This should be included in the layout or on pages that require database access
 */
export default function DatabaseAutoFix() {
  const { data: user, loading: userLoading } = useUser();
  const [checking, setChecking] = useState(false);
  const [fixed, setFixed] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Only run the check if we have a user and they're an admin
    // This prevents unnecessary checks for regular users
    if (user && !userLoading && !checking && !fixed) {
      // Check if the user is an admin by looking at their profile
      const checkIfAdmin = async () => {
        try {
          const { data: profile, error } = await supabase
            .from('user_profiles')
            .select('role')
            .eq('id', user.id)
            .single();

          if (error) {
            console.error('Error checking user role:', error);
            return;
          }

          if (profile?.role !== 'admin') {
            // Not an admin, don't run the check
            return;
          }

          const checkAndFix = async () => {
            try {
              setChecking(true);
              const result = await autoFixDatabaseIfNeeded();
              if (result.fixed) {
                setFixed(true);
                console.log('Database auto-fix completed:', result.message);
              }
            } catch (err) {
              console.error('Error in database auto-fix:', err);
              setError(err.message);
            } finally {
              setChecking(false);
            }
          };

          // User is an admin, run the check
          checkAndFix();
        } catch (err) {
          console.error('Error checking admin status:', err);
        }
      };

      checkIfAdmin();
    }
  }, [user, userLoading, checking, fixed]);

  // This component doesn't render anything visible
  return null;
}
