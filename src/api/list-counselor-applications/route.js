async function handler() {
  const session = getSession();

  if (!session?.user?.id) {
    return {
      error: "Unauthorized - Please sign in",
      status: 401,
    };
  }

  // Check if user has admin role
  const adminCheck = await sql`
    SELECT role FROM user_profiles 
    WHERE user_id = ${session.user.id}
  `;

  if (!adminCheck.length || adminCheck[0].role !== "admin") {
    return {
      error: "Forbidden - Admin access required",
      status: 403,
    };
  }

  try {
    const applications = await sql`
      SELECT 
        ca.*,
        up.display_name,
        up.email,
        up.role,
        up.bio
      FROM counselor_applications ca
      LEFT JOIN user_profiles up ON ca.user_id = up.user_id
      ORDER BY ca.created_at DESC
    `;

    return {
      applications,
      status: 200,
    };
  } catch (error) {
    return {
      error: "Failed to fetch counselor applications",
      details: error.message,
      status: 500,
    };
  }
}