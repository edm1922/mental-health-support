async function handler({ postId, content }) {
  const session = getSession();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  if (!postId || !content) {
    return { error: "Post ID and content are required" };
  }

  try {
    const post = await sql`
      SELECT id FROM discussion_posts 
      WHERE id = ${postId}
    `;

    if (!post.length) {
      return { error: "Post not found" };
    }

    const [comment] = await sql`
      INSERT INTO discussion_comments (post_id, user_id, content)
      VALUES (${postId}, ${session.user.id}, ${content})
      RETURNING *
    `;

    return { comment };
  } catch (error) {
    return { error: "Failed to create comment" };
  }
}