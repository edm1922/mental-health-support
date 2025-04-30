async function handler({ title, content }) {
  const session = getSession();

  if (!session?.user?.id) {
    return { error: "Authentication required" };
  }

  if (!title || !content) {
    return { error: "Title and content are required" };
  }

  try {
    const [post] = await sql`
      INSERT INTO discussion_posts (user_id, title, content)
      VALUES (${session.user.id}, ${title}, ${content})
      RETURNING id, title, content, created_at
    `;

    return { post };
  } catch (error) {
    return { error: "Failed to create post" };
  }
}