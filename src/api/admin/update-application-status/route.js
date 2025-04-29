async function handler({ applicationId, status }) {
  const session = getSession();

  if (!session?.user?.id) {
    return { error: "Unauthorized - Please log in" };
  }

  try {
    const adminCheck = await sql`
      SELECT role FROM user_profiles 
      WHERE user_id = ${session.user.id}
    `;

    if (!adminCheck.length || adminCheck[0].role !== "admin") {
      return { error: "Unauthorized - Admin access required" };
    }

    const validStatuses = ["approved", "rejected", "pending"];
    if (!validStatuses.includes(status)) {
      return { error: "Invalid status value" };
    }

    const result = await sql.transaction(async (sql) => {
      const application = await sql`
        UPDATE counselor_applications 
        SET status = ${status},
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ${applicationId}
        RETURNING user_id, status
      `;

      if (!application.length) {
        throw new Error("Application not found");
      }

      if (status === "approved") {
        await sql`
          UPDATE user_profiles 
          SET role = 'counselor',
              updated_at = CURRENT_TIMESTAMP
          WHERE user_id = ${application[0].user_id}
        `;
      }

      return application[0];
    });

    return { success: true, data: result };
  } catch (error) {
    return { error: error.message || "Failed to update application status" };
  }
}