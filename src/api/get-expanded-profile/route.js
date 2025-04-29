async function handler({ userId }) {
  const session = getSession();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  const targetUserId = userId || session.user.id;

  const [basicProfile] = await sql`
    SELECT 
      u.id,
      u.name,
      u.email,
      u.image,
      up.role,
      up.display_name,
      up.bio,
      up.created_at,
      up.last_active
    FROM auth_users u
    LEFT JOIN user_profiles up ON up.user_id = u.id::text
    WHERE u.id = ${targetUserId}::integer
  `;

  if (!basicProfile) {
    return { error: "Profile not found" };
  }

  const [expandedProfile] = await sql`
    SELECT 
      age,
      gender,
      location,
      interests,
      occupation,
      preferred_contact_method,
      emergency_contact,
      languages,
      about_me,
      seeking_help_for,
      comfort_with_sharing
    FROM user_profiles
    WHERE user_id = ${targetUserId}::text
  `;

  return {
    ...basicProfile,
    expanded: expandedProfile || {},
  };
}