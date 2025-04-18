async function handler({ id }) {
  if (!id) {
    return { error: "Post ID is required" };
  }

  const [posts] = await sql`
    SELECT 
      dp.*,
      up.display_name as author_name,
      up.role as author_role
    FROM discussion_posts dp
    LEFT JOIN user_profiles up ON dp.user_id = up.user_id
    WHERE dp.id = ${id}
  `;

  if (!posts) {
    return { error: "Post not found" };
  }

  const comments = await sql`
    SELECT 
      dc.*,
      up.display_name as author_name,
      up.role as author_role
    FROM discussion_comments dc
    LEFT JOIN user_profiles up ON dc.user_id = up.user_id
    WHERE dc.post_id = ${id}
    ORDER BY dc.created_at ASC
  `;

  return {
    post: posts,
    comments,
  };
}