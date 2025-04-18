async function handler({ applicationId, status }) {
  const session = getSession();

  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  const adminProfile = await sql`
    SELECT role FROM user_profiles 
    WHERE user_id = ${session.user.id}
  `;

  if (!adminProfile?.[0] || adminProfile[0].role !== "admin") {
    return { error: "Unauthorized - Admin access required" };
  }

  if (!["approved", "rejected"].includes(status)) {
    return { error: "Invalid status" };
  }

  const result = await sql.transaction(async (sql) => {
    const application = await sql`
      UPDATE counselor_applications
      SET status = ${status},
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ${applicationId}
      RETURNING user_id, status
    `;

    if (!application?.[0]) {
      throw new Error("Application not found");
    }

    if (status === "approved") {
      await sql`
        UPDATE user_profiles
        SET role = 'counselor'
        WHERE user_id = ${application[0].user_id}
      `;
    }

    return application[0];
  });

  return result;
}