import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

export const useUser = () => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Function to fetch the user profile from the database
  const fetchUserProfile = async (userId) => {
    if (!userId) return null;

    try {
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code === 'PGRST116') {
        // Not found - create a new profile
        console.log('Creating user profile for:', userId);
        const { data: sessionData } = await supabase.auth.getSession();
        const session = sessionData?.session;
        const displayName = session?.user?.user_metadata?.display_name ||
                           session?.user?.email?.split('@')[0] || 'User';

        // Check if the user has a role in their metadata
        const { data: userData } = await supabase.auth.getUser();
        const userRole = userData?.user?.user_metadata?.role || 'user';

        console.log('Creating profile with role from metadata:', userRole);

        const { data: newProfile, error: createError } = await supabase
          .from('user_profiles')
          .insert({
            id: userId,
            display_name: displayName,
            bio: '',
            role: userRole,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (createError) {
          console.error('Error creating user profile:', createError);
          return null;
        } else {
          console.log('User profile created successfully:', newProfile);
          return newProfile;
        }
      } else if (error) {
        console.error('Error checking user profile:', error);
        return null;
      } else {
        console.log('User profile exists:', profile);
        return profile;
      }
    } catch (profileError) {
      console.error('Error handling user profile:', profileError);
      return null;
    }
  };

  useEffect(() => {
    const fetchSession = async () => {
      try {
        console.log('Fetching user session...');
        const { data: { session } } = await supabase.auth.getSession();
        console.log('Session result:', session ? 'User is authenticated' : 'No session');

        if (session?.user) {
          console.log('User ID:', session.user.id);
          console.log('User email:', session.user.email);

          // Fetch the user profile
          const profile = await fetchUserProfile(session.user.id);
          console.log('User profile fetched:', profile);
          setUserProfile(profile);

          // Combine user data with profile data
          const userData = {
            ...session.user,
            profile: profile,
            // Add role directly to the user object for easier access
            role: profile?.role || 'user'
          };

          console.log('Setting user data with role:', userData.role);
          setUser(userData);
        } else {
          console.log('No authenticated user found');
          setUser(null);
          setUserProfile(null);
        }
      } catch (error) {
        console.error('Error fetching session:', error);
        setUser(null);
        setUserProfile(null);
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
        setUserProfile(null);
      }
    });

    return () => {
      console.log('Cleaning up auth subscription');
      if (subscription && typeof subscription.unsubscribe === 'function') {
        subscription.unsubscribe();
      }
    };
  }, []);

  // Function to refresh the user profile
  const refreshUserProfile = async () => {
    if (!user?.id) return;

    setLoading(true);
    const profile = await fetchUserProfile(user.id);
    setUserProfile(profile);

    // Update the user object with the new profile
    setUser(prev => ({
      ...prev,
      profile: profile
    }));

    setLoading(false);
    return profile;
  };

  // Return in the format expected by components
  return {
    data: user,
    loading,
    user, // For backward compatibility
    profile: userProfile,
    role: user?.role || userProfile?.role || null, // Add role directly for easier access
    refreshUserProfile // Add the refresh function
  };
};
