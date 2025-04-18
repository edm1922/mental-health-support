async function handler() {
  const session = getSession();
  if (!session?.user?.id) {
    return { error: "Not authenticated" };
  }

  const counselorProfile = await sql`
    SELECT * FROM user_profiles 
    WHERE user_id = ${session.user.id} 
    AND role = 'counselor'
  `;

  if (!counselorProfile.length) {
    return { error: "Not authorized - counselor access only" };
  }

  const sessions = await sql`
    SELECT 
      cs.*,
      up.display_name as patient_name
    FROM counseling_sessions cs
    LEFT JOIN user_profiles up ON cs.patient_id = up.user_id
    WHERE cs.counselor_id = ${session.user.id}
    ORDER BY cs.scheduled_for ASC
  `;

  return { sessions };
}