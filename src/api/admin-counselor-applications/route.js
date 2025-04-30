async function handler({ applicationId, status, action = "list" }) {
  const session = getSession();
  if (!session?.user?.id) {
    return { error: "Unauthorized - Please log in" };
  }

  const userProfile = await sql`
    SELECT role FROM user_profiles 
    WHERE user_id = ${session.user.id}
  `;

  if (!userProfile?.[0]?.role === "admin") {
    return { error: "Unauthorized - Admin access required" };
  }

  if (action === "update" && applicationId && status) {
    if (!["approved", "rejected"].includes(status)) {
      return { error: "Invalid status. Must be approved or rejected" };
    }

    await sql.transaction(async (sql) => {
      await sql`
        UPDATE counselor_applications 
        SET status = ${status}, 
            updated_at = CURRENT_TIMESTAMP 
        WHERE id = ${applicationId}
      `;

      if (status === "approved") {
        await sql`
          UPDATE user_profiles 
          SET role = 'counselor' 
          WHERE user_id = (
            SELECT user_id 
            FROM counselor_applications 
            WHERE id = ${applicationId}
          )
        `;
      }
    });

    return { success: true, message: `Application ${status}` };
  }

  const applications = await sql`
    SELECT 
      ca.*,
      up.display_name,
      up.email
    FROM counselor_applications ca
    JOIN user_profiles up ON ca.user_id = up.user_id
    ORDER BY ca.created_at DESC
  `;

  return { applications };
}