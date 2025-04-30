async function handler() {
  const posts = await sql`
    SELECT 
      dp.*,
      up.display_name as author_name,
      up.role as author_role
    FROM discussion_posts dp
    LEFT JOIN user_profiles up ON dp.user_id = up.user_id
    ORDER BY dp.created_at DESC
  `;

  return { posts };
}