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

        // Fix RLS policies
        await fetch('/api/auth/fix-rls');

        // Fix counselor chat RLS policies
        await fetch('/api/auth/fix-counselor-chat');

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

            // Create a test session and message for new users
            const { data: newSession, error: sessionError } = await supabase
              .from('counseling_sessions')
              .insert({
                counselor_id: session.user.id,
                patient_id: session.user.id,
                session_date: new Date().toISOString(),
                status: 'test',
                notes: 'This is a test session created automatically'
              })
              .select()
              .single();

            if (sessionError) {
              console.error('Error creating test session:', sessionError);
            } else if (newSession) {
              console.log('Test session created:', newSession.id);

              // Create a test message
              const { error: messageError } = await supabase
                .from('session_messages')
                .insert({
                  session_id: newSession.id,
                  sender_id: session.user.id,
                  recipient_id: session.user.id,
                  message: 'Welcome! This is a test message created automatically.',
                  is_read: false
                });

              if (messageError) {
                console.error('Error creating test message:', messageError);
              } else {
                console.log('Test message created successfully');
              }
            }
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
