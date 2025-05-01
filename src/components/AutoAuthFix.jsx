"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabaseClient';

export default function AutoAuthFix() {
  const [fixed, setFixed] = useState(false);

  useEffect(() => {
    const fixAuth = async () => {
      try {
        // Only run once
        if (fixed) return;

        // Check if user is authenticated
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          // Not authenticated, nothing to fix
          setFixed(true);
          return;
        }

        // Skip RLS policy fixes as they require special permissions
        console.log('Skipping RLS policy fixes - not critical for authentication');

        // Check if user profile exists
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('id')
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

            // Skip creating test sessions and messages to avoid potential errors
            console.log('Skipping test session and message creation');
          }
        }

        setFixed(true);
      } catch (error) {
        console.error('Error in AutoAuthFix:', error);
        setFixed(true); // Mark as fixed anyway to prevent infinite retries
      }
    };

    fixAuth();
  }, [fixed]);

  // This component doesn't render anything visible
  return null;
}
