async function handler({ mood, notes }) {
  const session = getSession();

  if (!session?.user?.id) {
    return { error: "Authentication required" };
  }

  if (!mood || mood < 1 || mood > 5) {
    return { error: "Mood rating must be between 1 and 5" };
  }

  const [checkin] = await sql`
    INSERT INTO mental_health_checkins (
      user_id,
      mood_rating,
      notes
    ) VALUES (
      ${session.user.id},
      ${mood},
      ${notes || null}
    )
    RETURNING *
  `;

  return { checkin };
}