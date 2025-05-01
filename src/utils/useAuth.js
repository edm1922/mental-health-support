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
      // Use Supabase's signInWithPassword method
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw new Error(error.message || 'Failed to sign in');
      }

      if (!data?.user) {
        throw new Error('Authentication failed. Please try again.');
      }

      // Set the user state
      setUser(data.user);

      return data.user;
    } catch (error) {
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
