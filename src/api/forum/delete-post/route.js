async function handler({ postId }) {
  const session = getSession();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  const [post] = await sql`
    SELECT user_id 
    FROM discussion_posts 
    WHERE id = ${postId}
  `;

  if (!post) {
    return { error: "Post not found" };
  }

  if (post.user_id !== session.user.id) {
    return { error: "Not authorized to delete this post" };
  }

  await sql`
    DELETE FROM discussion_posts 
    WHERE id = ${postId} 
    AND user_id = ${session.user.id}
  `;

  return { success: true };
}