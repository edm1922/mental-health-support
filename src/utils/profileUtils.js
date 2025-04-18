import { supabase } from './supabaseClient';

/**
 * Determines if mental health fields should be shown for a user
 * @param {string} userId - The user ID to check
 * @returns {Promise<Object>} Object with isCounselor and shouldShowMentalHealthFields flags
 */
export async function shouldShowMentalHealthFields(userId) {
  try {
    // Get the user's profile
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', userId)
      .single();
      
    if (error) {
      console.error('Error checking user role:', error);
      // Default to showing mental health fields if there's an error
      return { 
        isCounselor: false, 
        shouldShowMentalHealthFields: true 
      };
    }
    
    const isCounselor = profile?.role === 'counselor';
    
    // Only show mental health fields for non-counselors
    return {
      isCounselor,
      shouldShowMentalHealthFields: !isCounselor
    };
  } catch (err) {
    console.error('Exception checking mental health fields visibility:', err);
    // Default to showing mental health fields if there's an exception
    return { 
      isCounselor: false, 
      shouldShowMentalHealthFields: true 
    };
  }
}

/**
 * Ensures that counselor fields exist in the database
 * @returns {Promise<boolean>} True if successful, false otherwise
 */
export async function ensureCounselorFields() {
  try {
    // Try to add the counselor fields to the user_profiles table
    const { error } = await supabase.rpc('exec_sql', {
      sql: `
        -- Add counselor-specific fields to user_profiles table
        ALTER TABLE public.user_profiles 
          ADD COLUMN IF NOT EXISTS specializations TEXT[] DEFAULT '{}',
          ADD COLUMN IF NOT EXISTS years_experience INTEGER,
          ADD COLUMN IF NOT EXISTS credentials TEXT,
          ADD COLUMN IF NOT EXISTS availability_hours TEXT,
          ADD COLUMN IF NOT EXISTS professional_bio TEXT;
      `
    });
    
    if (error) {
      console.error('Error ensuring counselor fields:', error);
      return false;
    }
    
    return true;
  } catch (err) {
    console.error('Exception ensuring counselor fields:', err);
    return false;
  }
}
