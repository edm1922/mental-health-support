"use client";
import React, { useState, useEffect } from "react";
import { useUser } from "@/utils/useUser";
import { supabase } from "@/utils/supabaseClient";
import Link from "next/link";

export default function ForumModerationPage() {
  const { data: user, loading: userLoading } = useUser();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterType, setFilterType] = useState("all"); // "all", "flagged", "reported"
  const [selectedPost, setSelectedPost] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (user) {
      checkAdminStatus();
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadPosts();
    }
  }, [user, filterType]);

  const checkAdminStatus = async () => {
    try {
      // Get the current auth token
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        throw new Error('Authentication required');
      }

      // Check if the user is an admin
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profileError) {
        throw new Error('Failed to fetch user profile');
      }

      if (profile.role !== 'admin') {
        throw new Error('Only administrators can access this page');
      }
    } catch (err) {
      console.error("Error checking admin status:", err);
      setError(err.message || "Failed to verify admin status");
    }
  };

  const loadPosts = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get the current auth token
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        throw new Error('Authentication required');
      }

      // Build the query
      let query = supabase
        .from('forum_posts')
        .select(`
          *,
          author:user_id(id, display_name, role),
          comments:forum_comments(count)
        `)
        .order('created_at', { ascending: false });

      // Add filter if not "all"
      if (filterType === "flagged") {
        query = query.eq('is_flagged', true);
      } else if (filterType === "reported") {
        query = query.gt('report_count', 0);
      }

      // Execute the query
      const { data: postData, error: postsError } = await query;

      if (postsError) {
        throw new Error('Failed to fetch forum posts');
      }

      setPosts(postData || []);
    } catch (err) {
      console.error("Error loading posts:", err);
      setError(err.message || "Failed to load posts");
    } finally {
      setLoading(false);
    }
  };

  const handleApprovePost = async (postId) => {
    try {
      setActionLoading(true);

      // Get the current auth token
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        throw new Error('Authentication required');
      }

      // Update the post
      const { error: updateError } = await supabase
        .from('forum_posts')
        .update({
          is_flagged: false,
          report_count: 0,
          moderated_by: user.id,
          moderated_at: new Date().toISOString()
        })
        .eq('id', postId);

      if (updateError) {
        throw new Error('Failed to approve post');
      }

      // Refresh the posts
      await loadPosts();
      setSelectedPost(null);
    } catch (err) {
      console.error("Error approving post:", err);
      setError(err.message || "Failed to approve post");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemovePost = async (postId) => {
    try {
      setActionLoading(true);

      // Get the current auth token
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        throw new Error('Authentication required');
      }

      // Update the post
      const { error: updateError } = await supabase
        .from('forum_posts')
        .update({
          is_removed: true,
          removed_by: user.id,
          removed_at: new Date().toISOString()
        })
        .eq('id', postId);

      if (updateError) {
        throw new Error('Failed to remove post');
      }

      // Refresh the posts
      await loadPosts();
      setSelectedPost(null);
    } catch (err) {
      console.error("Error removing post:", err);
      setError(err.message || "Failed to remove post");
    } finally {
      setActionLoading(false);
    }
  };

  const handlePinPost = async (postId) => {
    try {
      setActionLoading(true);

      // Get the current auth token
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        throw new Error('Authentication required');
      }

      // Get the current pin status
      const { data: postData, error: postError } = await supabase
        .from('forum_posts')
        .select('is_pinned')
        .eq('id', postId)
        .single();

      if (postError) {
        throw new Error('Failed to fetch post');
      }

      // Toggle the pin status
      const { error: updateError } = await supabase
        .from('forum_posts')
        .update({
          is_pinned: !postData.is_pinned,
          pinned_by: !postData.is_pinned ? user.id : null,
          pinned_at: !postData.is_pinned ? new Date().toISOString() : null
        })
        .eq('id', postId);

      if (updateError) {
        throw new Error('Failed to update pin status');
      }

      // Refresh the posts
      await loadPosts();
    } catch (err) {
      console.error("Error pinning post:", err);
      setError(err.message || "Failed to pin post");
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (userLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-xl p-8 max-w-md w-full">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Authentication Required</h1>
          <p className="text-gray-600 mb-6">Please sign in to access this page.</p>
          <Link href="/account/signin" className="block w-full bg-indigo-600 text-white text-center py-2 px-4 rounded-lg hover:bg-indigo-700">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-gray-600 shadow-md hover:bg-gray-50"
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
            Back to Home
          </Link>

          <Link
            href="/admin/dashboard"
            className="rounded-lg bg-[#357AFF] px-4 py-2 text-white hover:bg-[#2E69DE]"
          >
            Admin Dashboard
          </Link>
        </div>

        <h1 className="text-3xl font-bold text-gray-800 mb-6">Forum Moderation</h1>

        {error && (
          <div className="mb-6 bg-red-50 p-4 rounded-lg text-red-600">
            {error}
          </div>
        )}

        <div className="mb-6 flex justify-between items-center">
          <div className="flex space-x-2">
            <button
              onClick={() => setFilterType("all")}
              className={`px-4 py-2 rounded-lg text-sm ${
                filterType === "all"
                  ? "bg-indigo-600 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              All Posts
            </button>
            <button
              onClick={() => setFilterType("flagged")}
              className={`px-4 py-2 rounded-lg text-sm ${
                filterType === "flagged"
                  ? "bg-indigo-600 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              Flagged Posts
            </button>
            <button
              onClick={() => setFilterType("reported")}
              className={`px-4 py-2 rounded-lg text-sm ${
                filterType === "reported"
                  ? "bg-indigo-600 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              Reported Posts
            </button>
          </div>

          <Link
            href="/community"
            className="rounded-lg bg-white px-4 py-2 text-gray-600 hover:bg-gray-50"
          >
            View Forum
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Posts List */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-xl shadow-xl overflow-hidden">
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading posts...</p>
                </div>
              ) : posts.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">No posts found</p>
                  <p className="text-sm text-gray-400 mt-2">Try adjusting your filters</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {posts.map((post) => (
                    <div 
                      key={post.id} 
                      className={`p-4 hover:bg-gray-50 cursor-pointer ${
                        selectedPost?.id === post.id ? "bg-indigo-50" : ""
                      }`}
                      onClick={() => setSelectedPost(post)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-lg font-medium text-gray-900">
                          {post.is_pinned && (
                            <span className="mr-2 text-indigo-600">📌</span>
                          )}
                          {post.title}
                        </h3>
                        <div className="flex space-x-2">
                          {post.is_flagged && (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              Flagged
                            </span>
                          )}
                          {post.report_count > 0 && (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              {post.report_count} Reports
                            </span>
                          )}
                          {post.is_removed && (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              Removed
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex justify-between items-center text-sm text-gray-500">
                        <div>
                          By: {post.author?.display_name || "Unknown"} 
                          {post.author?.role === "counselor" && (
                            <span className="ml-1 px-1.5 py-0.5 rounded text-xs bg-blue-100 text-blue-800">
                              Counselor
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-4">
                          <span>{formatDate(post.created_at)}</span>
                          <span>{post.comments[0].count} comments</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Post Details & Actions */}
          <div>
            <div className="bg-white rounded-xl shadow-xl p-6">
              {!selectedPost ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">Select a post to view details</p>
                </div>
              ) : (
                <div>
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">Post Details</h2>
                  
                  <div className="mb-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">{selectedPost.title}</h3>
                    <p className="text-gray-700 mb-4">{selectedPost.content}</p>
                    
                    <div className="flex justify-between text-sm text-gray-500">
                      <div>By: {selectedPost.author?.display_name || "Unknown"}</div>
                      <div>{formatDate(selectedPost.created_at)}</div>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-4">
                    <h3 className="text-md font-medium text-gray-800 mb-3">Moderation Actions</h3>
                    
                    <div className="space-y-3">
                      {selectedPost.is_flagged || selectedPost.report_count > 0 ? (
                        <button
                          onClick={() => handleApprovePost(selectedPost.id)}
                          disabled={actionLoading}
                          className="w-full flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                        >
                          {actionLoading ? (
                            <span className="mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                          ) : null}
                          Approve Post
                        </button>
                      ) : null}
                      
                      <button
                        onClick={() => handlePinPost(selectedPost.id)}
                        disabled={actionLoading}
                        className="w-full flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                      >
                        {actionLoading ? (
                          <span className="mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        ) : null}
                        {selectedPost.is_pinned ? "Unpin Post" : "Pin Post"}
                      </button>
                      
                      {!selectedPost.is_removed && (
                        <button
                          onClick={() => handleRemovePost(selectedPost.id)}
                          disabled={actionLoading}
                          className="w-full flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                        >
                          {actionLoading ? (
                            <span className="mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                          ) : null}
                          Remove Post
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
