async function handler({ sessionId, notes }) {
  const session = getSession();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  const userProfile = await sql`
    SELECT * FROM user_profiles 
    WHERE user_id = ${session.user.id}
  `;

  if (!userProfile?.[0] || userProfile[0].role !== "counselor") {
    return { error: "Only counselors can update session notes" };
  }

  const counselingSession = await sql`
    SELECT * FROM counseling_sessions 
    WHERE id = ${sessionId} 
    AND counselor_id = ${session.user.id}
  `;

  if (!counselingSession?.[0]) {
    return { error: "Session not found or unauthorized" };
  }

  const updatedSession = await sql`
    UPDATE counseling_sessions 
    SET notes = ${notes} 
    WHERE id = ${sessionId} 
    RETURNING *
  `;

  return { session: updatedSession[0] };
}