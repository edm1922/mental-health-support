async function handler({ userId, role, displayName, bio }) {
  if (!userId) {
    return { error: "User ID is required" };
  }

  if (!role) {
    return { error: "Role is required" };
  }

  const validRoles = ["patient", "counselor", "nurse", "admin"];
  if (!validRoles.includes(role)) {
    return {
      error: "Invalid role. Must be one of: patient, counselor, nurse, admin",
    };
  }

  try {
    const [profile] = await sql`
      INSERT INTO user_profiles (
        user_id,
        role,
        display_name,
        bio
      )
      VALUES (
        ${userId},
        ${role},
        ${displayName || null},
        ${bio || null}
      )
      RETURNING *
    `;

    return {
      id: profile.id,
      userId: profile.user_id,
      role: profile.role,
      displayName: profile.display_name,
      bio: profile.bio,
      createdAt: profile.created_at,
    };
  } catch (error) {
    if (error.code === "23505") {
      return { error: "A profile already exists for this user" };
    }
    console.error("Error creating user profile:", error);
    return { error: "Failed to create user profile" };
  }
}