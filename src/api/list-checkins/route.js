async function handler() {
  const session = getSession();

  if (!session?.user?.id) {
    return {
      error: "Not authenticated",
    };
  }

  const userId = session.user.id;

  const checkins = await sql`
    SELECT id, mood_rating, notes, created_at 
    FROM mental_health_checkins 
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
  `;

  return {
    checkins,
  };
}