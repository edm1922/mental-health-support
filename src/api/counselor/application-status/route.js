async function handler() {
  const session = getSession();
  if (!session?.user?.id) {
    return { error: "Not authenticated" };
  }

  try {
    const [application] = await sql`
      SELECT status, created_at, updated_at
      FROM counselor_applications 
      WHERE user_id = ${session.user.id}
      ORDER BY created_at DESC
      LIMIT 1
    `;

    if (!application) {
      return { status: "not_found" };
    }

    return {
      status: application.status,
      submittedAt: application.created_at,
      updatedAt: application.updated_at,
    };
  } catch (error) {
    console.error("Error fetching counselor application:", error);
    return { error: "Failed to fetch application status" };
  }
}