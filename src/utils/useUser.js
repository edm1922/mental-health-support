import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

export const useUser = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        console.log('Fetching user session...');
        const { data: { session } } = await supabase.auth.getSession();
        console.log('Session result:', session ? 'User is authenticated' : 'No session');

        if (session?.user) {
          console.log('User ID:', session.user.id);
          console.log('User email:', session.user.email);

          // Fetch the user profile to ensure it exists
          try {
            const { data: profile, error } = await supabase
              .from('user_profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();

            if (error && error.code === 'PGRST116') { // Not found
              console.log('Creating user profile for:', session.user.id);
              const displayName = session.user.user_metadata?.display_name ||
                                session.user.email?.split('@')[0] ||
                                'User';

              const { error: createError } = await supabase
                .from('user_profiles')
                .insert({
                  id: session.user.id,
                  display_name: displayName,
                  bio: '',
                  role: 'user',
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                });

              if (createError) {
                console.error('Error creating user profile:', createError);
              } else {
                console.log('User profile created successfully');
              }
            } else if (error) {
              console.error('Error checking user profile:', error);
            } else {
              console.log('User profile exists:', profile);
            }
          } catch (profileError) {
            console.error('Error handling user profile:', profileError);
          }

          setUser(session.user);
        } else {
          console.log('No authenticated user found');
          setUser(null);
        }
      } catch (error) {
        console.error('Error fetching session:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchSession();

    // Listen for auth state changes
    const { data: subscription } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event);
      console.log('New session:', session ? 'User is authenticated' : 'No session');

      if (session?.user) {
        console.log('User ID:', session.user.id);
        fetchSession(); // Re-fetch the session to ensure profile exists
      } else {
        setUser(null);
      }
    });

    return () => {
      console.log('Cleaning up auth subscription');
      if (subscription && typeof subscription.unsubscribe === 'function') {
        subscription.unsubscribe();
      }
    };
  }, []);

  // Return in the format expected by components
  return {
    data: user,
    loading,
    user, // For backward compatibility
    profile: user?.user_metadata?.profile || null // Include profile data if available
  };
};
