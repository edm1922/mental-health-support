async function handler({ counselorId, patientId, type, scheduledFor }) {
  if (!counselorId || !patientId || !type || !scheduledFor) {
    return { error: "Missing required fields" };
  }

  const validTypes = ["one_on_one", "group"];
  if (!validTypes.includes(type)) {
    return { error: "Invalid session type. Must be 'one_on_one' or 'group'" };
  }

  try {
    const [session] = await sql`
      INSERT INTO counseling_sessions (
        counselor_id,
        patient_id,
        type,
        status,
        scheduled_for
      )
      VALUES (
        ${counselorId},
        ${patientId},
        ${type},
        'scheduled',
        ${scheduledFor}
      )
      RETURNING *
    `;

    return {
      id: session.id,
      counselorId: session.counselor_id,
      patientId: session.patient_id,
      type: session.type,
      status: session.status,
      scheduledFor: session.scheduled_for,
      notes: session.notes,
      createdAt: session.created_at,
    };
  } catch (error) {
    console.error("Error creating counseling session:", error);
    return { error: "Failed to create counseling session" };
  }
}