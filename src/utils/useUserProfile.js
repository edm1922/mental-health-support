import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import { useUser } from './useUser';

export const useUserProfile = () => {
  const { data: user, loading: userLoading } = useUser();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching user profile:', error);
          setError(error.message);
        } else {
          setProfile(data);
          setError(null);
        }
      } catch (err) {
        console.error('Exception fetching user profile:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (!userLoading) {
      fetchUserProfile();
    }
  }, [user, userLoading]);

  return {
    profile,
    loading: loading || userLoading,
    error
  };
};
