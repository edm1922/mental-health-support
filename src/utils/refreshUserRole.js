import { supabase } from './supabaseClient';

/**
 * Refreshes the user's role by fetching the latest profile from the database
 * and updating the session metadata
 * 
 * @returns {Promise<Object>} The updated user profile
 */
export const refreshUserRole = async () => {
  try {
    // Get the current session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      console.error('No authenticated user found');
      return null;
    }
    
    // Fetch the latest user profile from the database
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();
      
    if (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
    
    console.log('Fetched user profile:', profile);
    
    // Update the user's metadata with the latest role
    const { data: updatedUser, error: updateError } = await supabase.auth.updateUser({
      data: { 
        role: profile.role,
        profile: profile
      }
    });
    
    if (updateError) {
      console.error('Error updating user metadata:', updateError);
    } else {
      console.log('Updated user metadata with role:', profile.role);
    }
    
    // Refresh the session to make sure the changes take effect
    await supabase.auth.refreshSession();
    
    return profile;
  } catch (error) {
    console.error('Error refreshing user role:', error);
    return null;
  }
};
