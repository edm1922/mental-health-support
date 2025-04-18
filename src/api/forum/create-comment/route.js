async function handler({ post_id, content }) {
  const session = getSession();
  if (!session?.user?.id) {
    return { error: "Authentication required" };
  }

  if (!post_id || !content) {
    return { error: "Post ID and content are required" };
  }

  try {
    const [post] = await sql`
      SELECT id FROM discussion_posts 
      WHERE id = ${post_id}
    `;

    if (!post) {
      return { error: "Post not found" };
    }

    const [comment] = await sql`
      INSERT INTO discussion_comments (post_id, user_id, content)
      VALUES (${post_id}, ${session.user.id}, ${content})
      RETURNING *
    `;

    return { comment };
  } catch (error) {
    return { error: "Failed to create comment" };
  }
}