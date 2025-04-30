import { supabase } from './supabaseClient';

/**
 * Ensures that the counselor-specific fields exist in the user_profiles table
 * This function can be called from any page that needs to use counselor fields
 * @returns {Promise<boolean>} True if fields exist or were created, false if there was an error
 */
export async function ensureCounselorFields() {
  try {
    console.log('Ensuring counselor fields exist in the database');
    
    // Try to execute the SQL script to add the fields
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
      console.error('Error adding counselor fields with SQL:', error);
      
      // If SQL execution fails, try a different approach
      // We'll check if we can update a profile with these fields
      // If it works, the fields exist; if it fails with a specific error, they don't
      
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error('No authenticated user found');
        return false;
      }
      
      // Try to update the current user's profile with a specializations field
      const testUpdate = await supabase
        .from('user_profiles')
        .update({
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)
        .select('specializations');
      
      // If we can select the specializations field, it exists
      if (!testUpdate.error || !testUpdate.error.message.includes('column "specializations" does not exist')) {
        console.log('Counselor fields appear to exist');
        return true;
      }
      
      console.error('Failed to verify or create counselor fields');
      return false;
    }
    
    console.log('Counselor fields added or already exist');
    return true;
  } catch (err) {
    console.error('Error ensuring counselor fields:', err);
    return false;
  }
}

/**
 * Updates a user's profile with counselor-specific information
 * @param {Object} counselorData - The counselor data to update
 * @param {string} counselorData.userId - The user ID
 * @param {string} [counselorData.credentials] - Professional credentials
 * @param {number} [counselorData.yearsExperience] - Years of experience
 * @param {Array<string>} [counselorData.specializations] - Areas of expertise
 * @param {string} [counselorData.availabilityHours] - When the counselor is available
 * @param {string} [counselorData.professionalBio] - Professional background
 * @returns {Promise<Object>} The updated profile or error
 */
export async function updateCounselorProfile(counselorData) {
  try {
    // First ensure the fields exist
    await ensureCounselorFields();
    
    // Update the profile with counselor data
    const { data, error } = await supabase
      .from('user_profiles')
      .update({
        credentials: counselorData.credentials,
        years_experience: counselorData.yearsExperience,
        specializations: counselorData.specializations || [],
        availability_hours: counselorData.availabilityHours,
        professional_bio: counselorData.professionalBio,
        updated_at: new Date().toISOString()
      })
      .eq('id', counselorData.userId)
      .select();
    
    if (error) {
      console.error('Error updating counselor profile:', error);
      return { error };
    }
    
    return { profile: data[0] };
  } catch (err) {
    console.error('Exception updating counselor profile:', err);
    return { error: err.message };
  }
}

/**
 * Gets a counselor's profile data
 * @param {string} counselorId - The counselor's user ID
 * @returns {Promise<Object>} The counselor profile or error
 */
export async function getCounselorProfile(counselorId) {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select(`
        id,
        display_name,
        bio,
        specializations,
        years_experience,
        credentials,
        availability_hours,
        professional_bio,
        preferred_contact_method,
        role,
        created_at,
        updated_at
      `)
      .eq('id', counselorId)
      .eq('role', 'counselor')
      .single();
    
    if (error) {
      console.error('Error fetching counselor profile:', error);
      return { error };
    }
    
    return { profile: data };
  } catch (err) {
    console.error('Exception fetching counselor profile:', err);
    return { error: err.message };
  }
}
