async function handler({ userId }) {
  if (!userId) {
    return { error: "User ID is required" };
  }

  try {
    const [profile] = await sql`
      SELECT * FROM user_profiles 
      WHERE user_id = ${userId}
    `;

    if (!profile) {
      return null;
    }

    return {
      id: profile.id,
      userId: profile.user_id,
      role: profile.role,
      displayName: profile.display_name,
      bio: profile.bio,
      createdAt: profile.created_at,
    };
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return { error: "Failed to fetch user profile" };
  }
}