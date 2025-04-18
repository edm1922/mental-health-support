async function handler({ userId }) {
  const session = getSession();

  if (!session?.user?.id) {
    return { error: "Unauthorized - Must be logged in" };
  }

  if (!userId) {
    return { error: "Missing required userId parameter" };
  }

  try {
    const result = await sql`
      SELECT promote_to_admin(${userId}, ${session.user.id}) as message
    `;

    return { message: result[0].message };
  } catch (error) {
    return { error: "Failed to update user role" };
  }
}