async function handler({ userId, title, content }) {
  if (!userId) {
    return { error: "User ID is required" };
  }

  if (!title || !title.trim()) {
    return { error: "Title is required" };
  }

  if (!content || !content.trim()) {
    return { error: "Content is required" };
  }

  try {
    const [post] = await sql`
      INSERT INTO discussion_posts (
        user_id,
        title,
        content
      )
      VALUES (
        ${userId},
        ${title},
        ${content}
      )
      RETURNING *
    `;

    return {
      id: post.id,
      userId: post.user_id,
      title: post.title,
      content: post.content,
      createdAt: post.created_at,
      updatedAt: post.updated_at,
    };
  } catch (error) {
    console.error("Error creating discussion post:", error);
    return { error: "Failed to create discussion post" };
  }
}