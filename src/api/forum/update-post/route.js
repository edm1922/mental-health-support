async function handler({ postId, title, content }) {
  const session = getSession();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  const existingPost = await sql`
    SELECT user_id 
    FROM discussion_posts 
    WHERE id = ${postId}
  `;

  if (!existingPost.length) {
    return { error: "Post not found" };
  }

  if (existingPost[0].user_id !== session.user.id) {
    return { error: "Not authorized to edit this post" };
  }

  const updatedPost = await sql`
    UPDATE discussion_posts 
    SET title = ${title},
        content = ${content},
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ${postId}
    RETURNING *
  `;

  return { post: updatedPost[0] };
}