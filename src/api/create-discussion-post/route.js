function handler({ title, content }) {
  const session = getSession();

  if (!session?.user?.id) {
    return { error: "You must be logged in to create a post" };
  }

  if (!title || !content) {
    return { error: "Title and content are required" };
  }

  const post = sql`
    INSERT INTO discussion_posts (user_id, title, content)
    VALUES (${session.user.id}, ${title}, ${content})
    RETURNING *
  `;

  return { post };
}