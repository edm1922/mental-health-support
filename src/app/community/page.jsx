"use client";
import React, { useState, useEffect } from "react";
import { useUser } from "@/utils/useUser";

function MainComponent() {
  const { data: user } = useUser();
  const [posts, setPosts] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);
  const [newPost, setNewPost] = useState({ title: "", content: "" });
  const [editingPost, setEditingPost] = useState(null);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showNewPostForm, setShowNewPostForm] = useState(false);

  useEffect(() => {
    initForumTables();
  }, []);

  const initForumTables = async () => {
    try {
      // Initialize forum tables if they don't exist
      const response = await fetch("/api/init-forum-tables", {
        method: "POST",
      });

      if (!response.ok) {
        const data = await response.json();
        console.error("Failed to initialize forum tables:", data.error);
      } else {
        console.log("Forum tables initialized successfully");
      }

      // Fetch posts after initializing tables
      fetchPosts();
    } catch (err) {
      console.error("Error initializing forum tables:", err);
      setError("Failed to initialize forum");
      setLoading(false);
    }
  };

  const fetchPosts = async () => {
    try {
      const response = await fetch("/api/forum/posts", {
        method: "POST",
      });
      if (!response.ok) {
        throw new Error("Failed to fetch posts");
      }
      const data = await response.json();
      setPosts(data.posts);
    } catch (err) {
      setError("Failed to load posts");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPostDetails = async (postId) => {
    try {
      const response = await fetch("/api/forum/post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: postId }),
      });
      if (!response.ok) {
        throw new Error("Failed to fetch post details");
      }
      const data = await response.json();
      setSelectedPost({
        ...data.post,
        comments: data.comments,
      });
    } catch (err) {
      setError("Failed to load post details");
      console.error(err);
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/forum/create-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPost),
      });

      if (!response.ok) {
        throw new Error("Failed to create post");
      }

      await fetchPosts();
      setNewPost({ title: "", content: "" });
      setShowNewPostForm(false);
    } catch (err) {
      setError("Failed to create post");
      console.error(err);
    }
  };

  const handleCreateComment = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/forum/create-comment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          post_id: selectedPost.id,
          content: newComment,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create comment");
      }

      await fetchPostDetails(selectedPost.id);
      setNewComment("");
    } catch (err) {
      setError("Failed to create comment");
      console.error(err);
    }
  };

  const handleEditPost = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/forum/update-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId: editingPost.id,
          title: editingPost.title,
          content: editingPost.content,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update post");
      }

      await fetchPostDetails(editingPost.id);
      setEditingPost(null);
    } catch (err) {
      setError("Failed to update post");
      console.error(err);
    }
  };

  const handleDeletePost = async (postId) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this post? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      const response = await fetch("/api/forum/delete-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete post");
      }

      setSelectedPost(null);
      await fetchPosts();
    } catch (err) {
      setError("Failed to delete post");
      console.error(err);
    }
  };

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-xl">
          <h1 className="mb-4 text-2xl font-bold text-gray-800">
            Sign In Required
          </h1>
          <p className="mb-6 text-gray-600">
            Please sign in to access the community forum.
          </p>
          <a
            href={`/account/signin?callbackUrl=${encodeURIComponent(
              "/community"
            )}`}
            className="inline-block rounded-lg bg-[#357AFF] px-6 py-3 text-white hover:bg-[#2E69DE]"
          >
            Sign In
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
      <div className="mx-auto max-w-4xl">
        <button
          onClick={() => window.history.back()}
          className="mb-4 flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-gray-600 shadow-md hover:bg-gray-50"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            strokeWidth="2"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Go Back
        </button>

        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-800">Community Forum</h1>
          <button
            onClick={() => setShowNewPostForm(true)}
            className="rounded-lg bg-[#357AFF] px-4 py-2 text-white hover:bg-[#2E69DE]"
          >
            New Post
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-4 text-red-500">
            {error}
          </div>
        )}

        {showNewPostForm && (
          <div className="mb-6 rounded-2xl bg-white p-6 shadow-xl">
            <form onSubmit={handleCreatePost}>
              <div className="mb-4">
                <input
                  type="text"
                  value={newPost.title}
                  onChange={(e) =>
                    setNewPost({ ...newPost, title: e.target.value })
                  }
                  placeholder="Post Title"
                  className="w-full rounded-lg border border-gray-200 p-3 focus:border-[#357AFF] focus:outline-none focus:ring-1 focus:ring-[#357AFF]"
                  required
                />
              </div>
              <div className="mb-4">
                <textarea
                  value={newPost.content}
                  onChange={(e) =>
                    setNewPost({ ...newPost, content: e.target.value })
                  }
                  placeholder="Write your post..."
                  className="h-32 w-full rounded-lg border border-gray-200 p-3 focus:border-[#357AFF] focus:outline-none focus:ring-1 focus:ring-[#357AFF]"
                  required
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowNewPostForm(false)}
                  className="rounded-lg border border-gray-200 px-4 py-2 text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-[#357AFF] px-4 py-2 text-white hover:bg-[#2E69DE]"
                >
                  Post
                </button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#357AFF] border-t-transparent"></div>
          </div>
        ) : selectedPost ? (
          <div className="rounded-2xl bg-white p-6 shadow-xl">
            <button
              onClick={() => {
                setSelectedPost(null);
                setEditingPost(null);
              }}
              className="mb-4 text-gray-600 hover:text-[#357AFF]"
            >
              ← Back to Posts
            </button>

            {editingPost ? (
              <form onSubmit={handleEditPost} className="mb-6">
                <input
                  type="text"
                  value={editingPost.title}
                  onChange={(e) =>
                    setEditingPost({ ...editingPost, title: e.target.value })
                  }
                  className="mb-4 w-full rounded-lg border border-gray-200 p-3 focus:border-[#357AFF] focus:outline-none focus:ring-1 focus:ring-[#357AFF]"
                  required
                />
                <textarea
                  value={editingPost.content}
                  onChange={(e) =>
                    setEditingPost({ ...editingPost, content: e.target.value })
                  }
                  className="mb-4 h-32 w-full rounded-lg border border-gray-200 p-3 focus:border-[#357AFF] focus:outline-none focus:ring-1 focus:ring-[#357AFF]"
                  required
                />
                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setEditingPost(null)}
                    className="rounded-lg border border-gray-200 px-4 py-2 text-gray-600 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-lg bg-[#357AFF] px-4 py-2 text-white hover:bg-[#2E69DE]"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            ) : (
              <>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-800">
                    {selectedPost.title}
                  </h2>
                  {selectedPost.user_id === user.id && (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setEditingPost(selectedPost)}
                        className="rounded-lg bg-gray-100 px-3 py-1 text-gray-600 hover:bg-gray-200"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeletePost(selectedPost.id)}
                        className="rounded-lg bg-red-100 px-3 py-1 text-red-600 hover:bg-red-200"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
                <div className="mb-4 text-sm text-gray-600">
                  Posted by {selectedPost.author_name || "Anonymous"} on{" "}
                  {new Date(selectedPost.created_at).toLocaleDateString()}
                </div>
                <p className="mb-8 text-gray-700">{selectedPost.content}</p>
              </>
            )}

            <div className="border-t pt-6">
              <h3 className="mb-4 text-xl font-bold text-gray-800">Comments</h3>
              <form onSubmit={handleCreateComment} className="mb-6">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Write a comment..."
                  className="mb-2 h-24 w-full rounded-lg border border-gray-200 p-3 focus:border-[#357AFF] focus:outline-none focus:ring-1 focus:ring-[#357AFF]"
                  required
                />
                <button
                  type="submit"
                  className="rounded-lg bg-[#357AFF] px-4 py-2 text-white hover:bg-[#2E69DE]"
                >
                  Add Comment
                </button>
              </form>

              <div className="space-y-4">
                {selectedPost.comments?.map((comment) => (
                  <div key={comment.id} className="rounded-lg bg-gray-50 p-4">
                    <div className="mb-2 text-sm text-gray-600">
                      {comment.author_name || "Anonymous"} -{" "}
                      {new Date(comment.created_at).toLocaleDateString()}
                    </div>
                    <p className="text-gray-700">{comment.content}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <div
                key={post.id}
                className="cursor-pointer rounded-2xl bg-white p-6 shadow-xl transition-shadow hover:shadow-2xl"
              >
                <div className="flex items-center justify-between">
                  <div
                    onClick={() => fetchPostDetails(post.id)}
                    className="flex-1"
                  >
                    <h2 className="mb-2 text-xl font-bold text-gray-800">
                      {post.title}
                    </h2>
                    <div className="mb-2 text-sm text-gray-600">
                      Posted by {post.author_name || "Anonymous"} on{" "}
                      {new Date(post.created_at).toLocaleDateString()}
                    </div>
                    <p className="text-gray-700">
                      {post.content.length > 200
                        ? `${post.content.substring(0, 200)}...`
                        : post.content}
                    </p>
                  </div>
                  {post.user_id === user.id && (
                    <div className="ml-4 flex flex-col space-y-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          fetchPostDetails(post.id).then(() =>
                            setEditingPost(post)
                          );
                        }}
                        className="rounded-lg bg-gray-100 px-3 py-1 text-gray-600 hover:bg-gray-200"
                      >
                        Edit
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeletePost(post.id);
                        }}
                        className="rounded-lg bg-red-100 px-3 py-1 text-red-600 hover:bg-red-200"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default MainComponent;