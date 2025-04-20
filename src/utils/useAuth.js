import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

export const useAuth = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
    };

    fetchSession();

    const { data: subscription } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      if (subscription && typeof subscription.unsubscribe === 'function') {
        subscription.unsubscribe();
      }
    };
  }, []);

  const signIn = async (email, password) => {
    try {
      console.log('Attempting to sign in with email:', email);

      // Clear any existing session first to avoid conflicts
      await supabase.auth.signOut();
      console.log('Cleared existing session');

      // Use Supabase's signInWithPassword method directly
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Sign-in error:', error);
        throw new Error(error.message || 'Failed to sign in');
      }

      if (!data?.user) {
        console.error('Sign-in returned no user');
        throw new Error('Authentication failed. Please try again.');
      }

      console.log('Sign-in successful, user:', data.user.id);
      console.log('Session:', data.session ? 'Valid session created' : 'No session created');

      // Verify the session was created
      const { data: sessionData } = await supabase.auth.getSession();
      console.log('Session verification:', sessionData.session ? 'Session exists' : 'No session found');

      setUser(data.user);
      return data.user;
    } catch (error) {
      console.error('Sign-in exception:', error);
      throw error;
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error);
      throw error;
    }
    setUser(null);
  };

  const signUp = async (email, password, displayName) => {
    try {
      console.log('Attempting to sign up with email:', email);
      const response = await fetch('/api/user/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, displayName }),
      });

      // Check if the response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error('Non-JSON response received:', await response.text());
        throw new Error('Server returned non-JSON response. Please try again later.');
      }

      const data = await response.json();

      if (!response.ok) {
        console.error('Sign-up error:', data);
        throw new Error(data.error || 'Failed to sign up');
      }

      console.log('Sign-up successful');

      // After successful signup, automatically sign in the user
      if (data.user) {
        await signIn(email, password);
      }

      return data;
    } catch (error) {
      console.error('Sign-up exception:', error);
      throw error;
    }
  };

  return { user, signIn, signOut, signUp };
};
