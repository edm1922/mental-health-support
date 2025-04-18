async function handler({
  counselor_id,
  patient_id,
  type,
  scheduled_for,
  notes,
}) {
  try {
    if (!counselor_id || !patient_id || !type || !scheduled_for) {
      return { error: "Missing required fields" };
    }

    if (!["one_on_one", "group"].includes(type)) {
      return { error: "Invalid session type" };
    }

    const scheduledDate = new Date(scheduled_for);
    if (isNaN(scheduledDate.getTime())) {
      return { error: "Invalid date format" };
    }

    const [session] = await sql`
      INSERT INTO counseling_sessions (
        counselor_id,
        patient_id,
        type,
        status,
        scheduled_for,
        notes
      )
      VALUES (
        ${counselor_id},
        ${patient_id},
        ${type},
        'scheduled',
        ${scheduledDate},
        ${notes || null}
      )
      RETURNING *
    `;

    return { session };
  } catch (error) {
    return { error: "Failed to create counseling session" };
  }
}