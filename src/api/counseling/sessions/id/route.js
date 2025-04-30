async function handler({ id, status }) {
  const session = getSession();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  const userProfile = await sql`
    SELECT * FROM user_profiles 
    WHERE user_id = ${session.user.id}
  `;

  if (!userProfile?.[0] || userProfile[0].role !== "counselor") {
    return { error: "Only counselors can update sessions" };
  }

  const counselingSession = await sql`
    SELECT * FROM counseling_sessions 
    WHERE id = ${id} AND counselor_id = ${session.user.id}
  `;

  if (!counselingSession?.[0]) {
    return { error: "Session not found or unauthorized" };
  }

  if (!["scheduled", "ongoing", "completed", "cancelled"].includes(status)) {
    return { error: "Invalid status" };
  }

  const updatedSession = await sql`
    UPDATE counseling_sessions 
    SET status = ${status}
    WHERE id = ${id} AND counselor_id = ${session.user.id}
    RETURNING *
  `;

  return { session: updatedSession[0] };
}