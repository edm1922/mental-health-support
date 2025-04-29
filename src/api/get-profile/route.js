async function handler() {
  const session = getSession();

  if (!session?.user?.id) {
    return { error: "Not authenticated" };
  }

  const profiles = await sql`
    SELECT * FROM user_profiles 
    WHERE user_id = ${session.user.id}
  `;

  if (!profiles.length) {
    return null;
  }

  return { profile: profiles[0] };
}