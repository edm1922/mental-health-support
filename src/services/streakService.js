import { supabase } from '../utils/supabaseClient';

/**
 * Fetch the current user's streak data
 * @returns {Promise<Object>} The user's streak data
 */
export async function getUserStreak() {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('user_streaks')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error('Error fetching streak data:', error);
      return { currentStreak: 0, longestStreak: 0 };
    }

    // If no streak data exists yet, return defaults
    if (!data) {
      return { currentStreak: 0, longestStreak: 0 };
    }

    return {
      currentStreak: data.current_streak || 0,
      longestStreak: data.longest_streak || 0,
      lastCheckIn: data.last_check_in,
      streakStartDate: data.streak_start_date
    };
  } catch (error) {
    console.error('Error in getUserStreak:', error);
    return { currentStreak: 0, longestStreak: 0 };
  }
}

/**
 * Check if the user has completed a check-in today
 * @returns {Promise<boolean>} Whether the user has checked in today
 */
export async function hasCheckedInToday() {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return false;
    }

    // Get today's date in UTC (start and end)
    const today = new Date();
    const startOfDay = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), 0, 0, 0));
    const endOfDay = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), 23, 59, 59));

    // Query for check-ins created today
    const { data, error } = await supabase
      .from('mental_health_checkins')
      .select('id')
      .eq('user_id', user.id)
      .gte('created_at', startOfDay.toISOString())
      .lte('created_at', endOfDay.toISOString())
      .limit(1);

    if (error) {
      console.error('Error checking today\'s check-in:', error);
      return false;
    }

    return data && data.length > 0;
  } catch (error) {
    console.error('Error in hasCheckedInToday:', error);
    return false;
  }
}

/**
 * Initialize a user's streak record if it doesn't exist
 * This is a fallback in case the database trigger fails
 */
export async function initializeUserStreak() {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return;
    }

    // Check if streak record exists
    const { data, error } = await supabase
      .from('user_streaks')
      .select('id')
      .eq('user_id', user.id)
      .limit(1);

    if (error) {
      console.error('Error checking streak record:', error);
      return;
    }

    // If no record exists, create one
    if (!data || data.length === 0) {
      const { error: insertError } = await supabase
        .from('user_streaks')
        .insert([
          {
            user_id: user.id,
            current_streak: 0,
            longest_streak: 0
          }
        ]);

      if (insertError) {
        console.error('Error initializing streak record:', insertError);
      }
    }
  } catch (error) {
    console.error('Error in initializeUserStreak:', error);
  }
}
