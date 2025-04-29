async function handler({ userId, moodRating, notes }) {
  if (!userId) {
    return { error: "User ID is required" };
  }

  if (!moodRating || typeof moodRating !== "number") {
    return { error: "Mood rating is required and must be a number" };
  }

  if (moodRating < 1 || moodRating > 5) {
    return { error: "Mood rating must be between 1 and 5" };
  }

  try {
    const [checkin] = await sql`
      INSERT INTO mental_health_checkins (
        user_id,
        mood_rating,
        notes
      )
      VALUES (
        ${userId},
        ${moodRating},
        ${notes || null}
      )
      RETURNING *
    `;

    return {
      id: checkin.id,
      userId: checkin.user_id,
      moodRating: checkin.mood_rating,
      notes: checkin.notes,
      createdAt: checkin.created_at,
    };
  } catch (error) {
    console.error("Error creating mental health check-in:", error);
    return { error: "Failed to create mental health check-in" };
  }
}