async function handler({ bio, imageUrl }) {
  const session = getSession();
  if (!session?.user?.id) {
    return { error: "Not authenticated" };
  }

  try {
    // First, check if a profile exists
    const existingProfile = await sql`
      SELECT * FROM user_profiles WHERE user_id = ${session.user.id}
    `;

    if (existingProfile.length === 0) {
      // Create new profile if it doesn't exist
      const newProfile = await sql`
        INSERT INTO user_profiles (user_id, bio, role, display_name)
        VALUES (${session.user.id}, ${bio}, 'patient', ${session.user.name})
        RETURNING *
      `;
      return { success: true, profile: newProfile[0] };
    } else {
      // Update existing profile
      const updatedProfile = await sql`
        UPDATE user_profiles 
        SET bio = ${bio},
            display_name = COALESCE(display_name, ${session.user.name})
        WHERE user_id = ${session.user.id}
        RETURNING *
      `;
      return { success: true, profile: updatedProfile[0] };
    }
  } catch (error) {
    console.error("Profile update error:", error);
    return { error: "Failed to update profile" };
  }
}