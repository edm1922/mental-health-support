async function handler() {
  const session = getSession();

  if (!session?.user?.id) {
    return {
      error: "Unauthorized - Please sign in",
      status: 401,
    };
  }

  const adminCheck = await sql`
    SELECT role FROM user_profiles 
    WHERE user_id = ${session.user.id}
  `;

  if (!adminCheck.length || adminCheck[0].role !== "admin") {
    return {
      error: "Unauthorized - Admin access required",
      status: 403,
    };
  }

  try {
    const applications = await sql`
      SELECT 
        ca.*,
        au.name,
        au.email,
        up.display_name,
        up.bio
      FROM counselor_applications ca
      LEFT JOIN auth_users au ON au.id::text = ca.user_id
      LEFT JOIN user_profiles up ON up.user_id = ca.user_id
      ORDER BY ca.created_at DESC
    `;

    return {
      applications,
      status: 200,
    };
  } catch (error) {
    return {
      error: "Failed to fetch counselor applications",
      status: 500,
    };
  }
}