"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "@/utils/supabaseClient";
import {
  GlassContainer,
  GlassCard,
  BackButton,
  ModernButton,
  ModernTextarea,
  ModernHeading,
  ModernAlert,
  ModernInput,
  ModernCard,
  ModernSpinner
} from "@/components/ui/ModernUI";

function CommunityPage() {
  const [posts, setPosts] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);
  const [newPost, setNewPost] = useState({ title: "", content: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [showNewPostForm, setShowNewPostForm] = useState(false);
  const [authStatus, setAuthStatus] = useState({ authenticated: false, checking: true });
  const [newComment, setNewComment] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [postToDelete, setPostToDelete] = useState(null);
  const [editingPost, setEditingPost] = useState(null);
  const [editFormData, setEditFormData] = useState({ title: "", content: "" });
  const [editingComment, setEditingComment] = useState(null);
  const [editCommentContent, setEditCommentContent] = useState("");

  // Check authentication status directly
  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log('Checking authentication status...');

        // Use the dedicated community auth endpoint
        try {
          const authResponse = await fetch('/api/auth/community-auth', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            }
          });

          if (authResponse.ok) {
            const authData = await authResponse.json();
            console.log('Auth check result:', authData);

            if (authData.authenticated) {
              console.log('User is authenticated via API:', authData.user.id);
              setAuthStatus({
                authenticated: true,
                checking: false,
                user: authData.user
              });
              return;
            } else {
              console.log('Not authenticated via API');
            }
          } else {
            console.log('Auth check API failed, falling back to direct check');
          }
        } catch (authApiError) {
          console.error('Error using auth API:', authApiError);
          console.log('Falling back to direct Supabase auth check');
        }

        // Fallback: direct Supabase auth check
        const { data: { session } } = await supabase.auth.getSession();

        if (session) {
          console.log('User is authenticated via direct check:', session.user.id);
          setAuthStatus({
            authenticated: true,
            checking: false,
            user: session.user
          });
        } else {
          console.log('No authenticated session found');
          setAuthStatus({
            authenticated: false,
            checking: false,
            user: null
          });
        }
      } catch (error) {
        console.error('Error checking auth:', error);
        setAuthStatus({
          authenticated: false,
          checking: false,
          error: error.message
        });
      }
    };

    checkAuth();

    // Set up auth state change listener
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session ? 'User session exists' : 'No session');

      if (session) {
        setAuthStatus({
          authenticated: true,
          checking: false,
          user: session.user
        });
      } else {
        setAuthStatus({
          authenticated: false,
          checking: false,
          user: null
        });
      }
    });

    // Clean up the listener when component unmounts
    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  // Fetch posts when component mounts
  useEffect(() => {
    // First check if we need to fix the schema
    checkAndFixSchema().then(() => {
      fetchPosts();
    });
  }, []);

  const checkAndFixSchema = async () => {
    try {
      setSuccessMessage(null);
      console.log('Checking if schema needs to be fixed...');

      // Try to fetch posts to see if there's a schema issue
      const { data, error } = await supabase
        .from('discussion_posts')
        .select('*')
        .limit(1);

      if (error) {
        console.log('Schema issue detected:', error.message);
        // Don't show error message to user, just fix it silently
        setLoading(true);

        // Use the simplified direct fix approach
        console.log('Applying direct fix to forum table...');
        const fixResponse = await fetch('/api/admin/fix-forum-table', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (fixResponse.ok) {
          console.log('Forum table fixed, checking if that resolved the issue...');
          // Try the query again after fixing the table
          const { data: retryData, error: retryError } = await supabase
            .from('discussion_posts')
            .select('*')
            .limit(1);

          if (!retryError) {
            console.log('Table fix resolved the issue!');
            return true;
          }
          console.log('Table fix did not resolve the issue, trying direct post creation...');
        } else {
          console.log('Table fix failed, will try direct post creation instead');
        }

        return true; // Continue anyway, we'll use direct SQL for posting
      }

      return true;
    } catch (error) {
      console.error('Error checking/fixing schema:', error);
      return false;
    }
  };

  const fetchPosts = async () => {
    try {
      setLoading(true);
      setSuccessMessage(null);
      setError(null);

      // First, automatically fix the schema if needed
      console.log('Checking and fixing forum table if needed...');
      await fetch('/api/admin/fix-forum-table', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      // Get current user to check for their pending posts
      const { data: { session } } = await supabase.auth.getSession();
      const currentUserId = session?.user?.id;

      // First try with the join query
      try {
        // Build query to get approved posts and the user's own pending posts
        let query = supabase
          .from('discussion_posts')
          .select(`
            *,
            user_profiles:user_id(display_name)
          `);

        // If user is logged in, show their pending posts too
        if (currentUserId) {
          query = query.or(`is_approved.eq.true,user_id.eq.${currentUserId}`);
        } else {
          query = query.eq('is_approved', true); // Only show approved posts for guests
        }

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) {
          // If there's a relationship error, try a simpler query
          if (error.message.includes('relationship')) {
            throw new Error('Relationship error, trying simpler query');
          }
          throw error;
        }

        // Format posts with author information
        const formattedPosts = data.map(post => ({
          ...post,
          author_name: post.user_profiles?.display_name || 'Unknown User'
        }));

        setPosts(formattedPosts);
        return;
      } catch (joinError) {
        console.log('Join query failed, trying simple query:', joinError);

        // If the join query fails, try a simple query
        const { data, error } = await supabase
          .from('discussion_posts')
          .select('*')
          .eq('is_approved', true) // Only show approved posts
          .order('created_at', { ascending: false });

        if (error) {
          throw error;
        }

        // Get user profiles for each post
        const userIds = data.map(post => post.user_id).filter(Boolean);

        if (userIds.length > 0) {
          const { data: profiles, error: profilesError } = await supabase
            .from('user_profiles')
            .select('id, display_name')
            .in('id', userIds);

          if (!profilesError && profiles) {
            // Create a map of user_id to display_name
            const userMap = {};
            profiles.forEach(profile => {
              userMap[profile.id] = profile.display_name;
            });

            // Format posts with author information
            const formattedPosts = data.map(post => ({
              ...post,
              author_name: post.user_id && userMap[post.user_id] ?
                userMap[post.user_id] :
                (post.user_id ? 'User ' + post.user_id.substring(0, 6) : 'Unknown User')
            }));

            setPosts(formattedPosts);
          } else {
            // Format posts with generic user IDs if we can't get profiles
            const simplePosts = data.map(post => ({
              ...post,
              author_name: post.user_id ?
                'User ' + post.user_id.substring(0, 6) :
                'Unknown User'
            }));

            setPosts(simplePosts);
          }
        } else {
          // Format posts without author information
          const simplePosts = data.map(post => ({
            ...post,
            author_name: 'Unknown User'
          }));

          setPosts(simplePosts);
        }
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
      setError('Could not load posts. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const fetchPostDetails = async (postId) => {
    try {
      setLoading(true);
      setError(null);
      setSuccessMessage(null);

      // Check authentication first
      const { data: { session } } = await supabase.auth.getSession();
      const isAuthenticated = !!session;
      console.log('Authentication check before fetching post:', isAuthenticated ? 'Authenticated' : 'Not authenticated');

      // First, automatically fix the schema if needed
      console.log('Checking and fixing forum table if needed...');
      await fetch('/api/admin/fix-forum-table', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log('Fetching post details for ID:', postId);

      // Try using the direct SQL endpoint first - this is our most reliable method
      try {
        console.log('Attempting to fetch post with direct SQL endpoint...');
        const response = await fetch(`/api/forum/direct-post-view`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ id: postId })
        });

        // Even if response is not ok, try to parse the error message
        const data = await response.json();

        if (!response.ok) {
          console.error('Direct SQL endpoint returned error:', data.error || 'Unknown error');
          throw new Error(data.error || 'Failed to fetch post details');
        }

        console.log('Post details fetched successfully via direct SQL:',
          data.post ? `Post ID: ${data.post.id}, Title: ${data.post.title}` : 'No post data');
        console.log('Comments fetched:', data.comments ? data.comments.length : 0);

        if (data.post) {
          setSelectedPost({
            ...data.post,
            comments: data.comments || []
          });
          return;
        } else {
          throw new Error('Post data not found in response');
        }
      } catch (directError) {
        console.error('Direct SQL error fetching post details:', directError);
        console.log('Falling back to public API endpoint...');
      }

      // Try using the public API endpoint as a fallback
      try {
        const response = await fetch(`/api/forum/public-post`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ id: postId })
        });

        // Even if response is not ok, try to parse the error message
        const data = await response.json();

        if (!response.ok) {
          console.error('Public API endpoint returned error:', data.error || 'Unknown error');
          throw new Error(data.error || 'Failed to fetch post details');
        }

        console.log('Post details fetched successfully via public API:',
          data.post ? `Post ID: ${data.post.id}, Title: ${data.post.title}` : 'No post data');

        if (data.post) {
          setSelectedPost({
            ...data.post,
            comments: data.comments || []
          });
          return;
        } else {
          throw new Error('Post data not found in response');
        }
      } catch (apiError) {
        console.error('Public API error fetching post details:', apiError);
        console.log('Falling back to direct Supabase client...');
      }

      // Last resort: Try direct SQL query via exec_sql RPC
      try {
        console.log('Attempting direct SQL query via RPC...');

        // Get the post with a simple SQL query
        const { data: postResult, error: postError } = await supabase.rpc('exec_sql', {
          sql: `SELECT * FROM public.discussion_posts WHERE id = ${postId};`
        });

        if (postError) {
          console.error('Error with direct SQL post query:', postError);
          throw postError;
        }

        // Handle different possible formats of the result
        let post = null;
        if (postResult && Array.isArray(postResult) && postResult.length > 0) {
          post = postResult[0];
        } else if (postResult && typeof postResult === 'object') {
          post = postResult;
        }

        if (!post) {
          throw new Error('Post not found');
        }

        // Get comments with a simple SQL query
        const { data: commentsResult, error: commentsError } = await supabase.rpc('exec_sql', {
          sql: `SELECT * FROM public.discussion_comments WHERE post_id = ${postId} ORDER BY created_at ASC;`
        });

        // Handle different possible formats of the comments result
        let comments = [];
        if (!commentsError) {
          if (commentsResult && Array.isArray(commentsResult)) {
            comments = commentsResult;
          } else if (commentsResult && typeof commentsResult === 'object') {
            comments = [commentsResult];
          }
        }

        console.log('Direct SQL query successful - Post found, Comments:', comments.length);

        // Format the post with minimal information
        const formattedPost = {
          id: post.id || 0,
          user_id: post.user_id || 'anonymous',
          title: post.title || 'Untitled Post',
          content: post.content || 'No content',
          created_at: post.created_at || new Date().toISOString(),
          updated_at: post.updated_at || new Date().toISOString(),
          author_name: 'Anonymous',
          is_approved: post.is_approved !== undefined ? post.is_approved : true,
          comments: comments.map(comment => ({
            id: comment.id || 0,
            post_id: comment.post_id || postId,
            user_id: comment.user_id || 'anonymous',
            content: comment.content || 'No comment',
            created_at: comment.created_at || new Date().toISOString(),
            updated_at: comment.updated_at || new Date().toISOString(),
            author_name: 'Anonymous'
          }))
        };

        setSelectedPost(formattedPost);
        return;
      } catch (directSqlError) {
        console.error('Direct SQL RPC query failed:', directSqlError);
        console.log('Falling back to Supabase client queries...');
      }

      // Final fallback: Try with Supabase client
      try {
        // Fetch the post
        const { data: post, error: postError } = await supabase
          .from('discussion_posts')
          .select('*')
          .eq('id', postId)
          .single();

        if (postError) {
          throw postError;
        }

        // Fetch comments for the post
        const { data: comments, error: commentsError } = await supabase
          .from('discussion_comments')
          .select('*')
          .eq('post_id', postId)
          .order('created_at', { ascending: true });

        // Format post with minimal information
        const formattedPost = {
          ...post,
          author_name: 'Anonymous',
          comments: (comments || []).map(comment => ({
            ...comment,
            author_name: 'Anonymous'
          }))
        };

        setSelectedPost(formattedPost);
      } catch (finalError) {
        console.error('All fallback methods failed:', finalError);
        throw finalError; // Let the outer catch handle this
      }
    } catch (error) {
      console.error('Error fetching post details:', error);
      setError('Could not load post details. Please try again later.');
      setSelectedPost(null);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError(null);
      setSuccessMessage(null);

      // Validate input
      if (!newPost.title.trim() || !newPost.content.trim()) {
        setError("Title and content are required");
        return;
      }

      // Check authentication
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        setError("You must be signed in to create a post");
        return;
      }

      // First, automatically fix the schema if needed
      console.log('Checking and fixing forum table if needed...');
      await fetch('/api/admin/fix-forum-table', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      // Try to create post using the Supabase client
      console.log('Attempting to create post with Supabase client...');
      const { data: post, error } = await supabase
        .from('discussion_posts')
        .insert({
          title: newPost.title,
          content: newPost.content,
          user_id: session.user.id,
          is_approved: false // Set to false by default, requiring admin approval
        })
        .select()
        .single();

      if (error) {
        console.log('Error creating post with Supabase client:', error.message);
        console.log('Trying direct SQL method...');

        // Use direct SQL method as fallback
        const response = await fetch('/api/forum/create-post-bypass-cache', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            title: newPost.title,
            content: newPost.content,
            userId: session.user.id
          })
        });

        if (!response.ok) {
          throw new Error('Failed to create post using direct SQL method');
        }

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || 'Failed to create post');
        }
      }

      // Reset form and refresh posts
      setNewPost({ title: "", content: "" });
      setShowNewPostForm(false);
      await fetchPosts();

      // Show success message with approval notice
      setSuccessMessage("Your post has been submitted successfully! It's now awaiting admin approval. You can see it marked as 'Pending Approval' in the forum, but other users won't see it until it's approved.");
      setError(null);

    } catch (error) {
      console.error('Error creating post:', error);
      setError('Could not create post. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateComment = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError(null);
      setSuccessMessage(null);

      // Validate input
      if (!newComment.trim()) {
        setError("Comment content is required");
        return;
      }

      // Check authentication
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        setError("You must be signed in to comment");
        return;
      }

      // First, automatically fix the schema if needed
      console.log('Checking and fixing forum table if needed...');
      await fetch('/api/admin/fix-forum-table', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log('Creating comment for post:', selectedPost.id);
      console.log('Comment content:', newComment);
      console.log('User ID:', session.user.id);

      // Try using the API endpoint first
      try {
        const response = await fetch('/api/forum/create-comment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            post_id: selectedPost.id,
            content: newComment
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to create comment');
        }

        console.log('Comment created successfully via API');
      } catch (apiError) {
        console.error('API error creating comment:', apiError);
        console.log('Falling back to direct Supabase client...');

        // Insert the comment using Supabase client as fallback
        const { error } = await supabase
          .from('discussion_comments')
          .insert({
            post_id: selectedPost.id,
            content: newComment,
            user_id: session.user.id
          });

        if (error) {
          console.error('Error creating comment with Supabase client:', error);
          throw error;
        }
      }

      // Reset form and refresh post details
      setNewComment("");
      setSuccessMessage("Comment added successfully");
      await fetchPostDetails(selectedPost.id);

    } catch (error) {
      console.error('Error creating comment:', error);
      setError('Could not create comment. Please try again later: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePost = async (postId) => {
    try {
      if (!confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
        return;
      }

      setLoading(true);
      setError(null);
      setSuccessMessage(null);

      // First try the authenticated endpoint
      try {
        console.log('Attempting to delete post with authenticated endpoint...');
        const response = await fetch('/api/forum/delete-post', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ postId })
        });

        const data = await response.json();

        if (!response.ok) {
          // If it's an authentication error, try the public endpoint
          if (response.status === 401) {
            console.log('Authentication error, trying public endpoint...');
            throw new Error('Authentication required, trying public endpoint');
          }
          throw new Error(data.error || 'Failed to delete post');
        }

        console.log('Post deleted successfully with authenticated endpoint');
        // Show success message
        setSuccessMessage('Post deleted successfully');

        // Go back to the post list
        setSelectedPost(null);

        // Refresh the posts list
        await fetchPosts();
        return;
      } catch (authError) {
        console.error('Error with authenticated delete:', authError);
        console.log('Falling back to public delete endpoint...');
      }

      // If we get here, try the public endpoint
      const publicResponse = await fetch('/api/forum/public-delete-post', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ postId })
      });

      const publicData = await publicResponse.json();

      if (!publicResponse.ok) {
        throw new Error(publicData.error || 'Failed to delete post with public endpoint');
      }

      console.log('Post deleted successfully with public endpoint');
      // Show success message
      setSuccessMessage('Post deleted successfully');

      // Go back to the post list
      setSelectedPost(null);

      // Refresh the posts list
      await fetchPosts();
    } catch (error) {
      console.error('Error deleting post:', error);
      setError(error.message || 'Could not delete post. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditPost = (post) => {
    setEditingPost(post);
    setEditFormData({
      title: post.title,
      content: post.content
    });
  };

  const handleCancelEdit = () => {
    setEditingPost(null);
    setEditFormData({ title: "", content: "" });
  };

  const handleUpdatePost = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      setSuccessMessage(null);

      // Validate input
      if (!editFormData.title.trim() || !editFormData.content.trim()) {
        setError("Title and content are required");
        return;
      }

      // Try the direct SQL endpoint first
      try {
        console.log('Attempting to update post with direct SQL endpoint...');
        const response = await fetch('/api/forum/direct-update-post-sql', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            postId: editingPost.id,
            title: editFormData.title,
            content: editFormData.content,
            userId: authStatus.user?.id
          })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to update post with direct SQL');
        }

        console.log('Post updated successfully with direct SQL endpoint');
        // Show success message
        setSuccessMessage('Post updated successfully');

        // Reset form and refresh posts
        setEditingPost(null);
        setEditFormData({ title: "", content: "" });

        // If we were editing a selected post, refresh its details
        if (selectedPost && selectedPost.id === editingPost.id) {
          await fetchPostDetails(editingPost.id);
        } else {
          // Otherwise just refresh the posts list
          await fetchPosts();
        }
        return;
      } catch (directError) {
        console.error('Error with direct SQL update:', directError);
        console.log('Falling back to authenticated endpoint...');
      }

      // If direct SQL fails, try the authenticated endpoint
      try {
        console.log('Attempting to update post with authenticated endpoint...');
        const response = await fetch('/api/forum/update-post', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            postId: editingPost.id,
            title: editFormData.title,
            content: editFormData.content
          })
        });

        const data = await response.json();

        if (!response.ok) {
          // If it's an authentication error, try the public endpoint
          if (response.status === 401) {
            console.log('Authentication error, trying public endpoint...');
            throw new Error('Authentication required, trying public endpoint');
          }
          throw new Error(data.error || 'Failed to update post');
        }

        console.log('Post updated successfully with authenticated endpoint');
        // Show success message
        setSuccessMessage('Post updated successfully');

        // Reset form and refresh posts
        setEditingPost(null);
        setEditFormData({ title: "", content: "" });

        // If we were editing a selected post, refresh its details
        if (selectedPost && selectedPost.id === editingPost.id) {
          await fetchPostDetails(editingPost.id);
        } else {
          // Otherwise just refresh the posts list
          await fetchPosts();
        }
        return;
      } catch (authError) {
        console.error('Error with authenticated update:', authError);
        console.log('Falling back to public update endpoint...');
      }

      // If we get here, try the public endpoint as a last resort
      const publicResponse = await fetch('/api/forum/public-update-post', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          postId: editingPost.id,
          title: editFormData.title,
          content: editFormData.content
        })
      });

      const publicData = await publicResponse.json();

      if (!publicResponse.ok) {
        throw new Error(publicData.error || 'Failed to update post with public endpoint');
      }

      console.log('Post updated successfully with public endpoint');
      // Show success message
      setSuccessMessage('Post updated successfully');

      // Reset form and refresh posts
      setEditingPost(null);
      setEditFormData({ title: "", content: "" });

      // If we were editing a selected post, refresh its details
      if (selectedPost && selectedPost.id === editingPost.id) {
        await fetchPostDetails(editingPost.id);
      } else {
        // Otherwise just refresh the posts list
        await fetchPosts();
      }
    } catch (error) {
      console.error('Error updating post:', error);
      setError(error.message || 'Could not update post. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditComment = (comment) => {
    setEditingComment(comment);
    setEditCommentContent(comment.content);
  };

  const handleCancelEditComment = () => {
    setEditingComment(null);
    setEditCommentContent("");
  };

  const handleUpdateComment = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      setSuccessMessage(null);

      // Validate input
      if (!editCommentContent.trim()) {
        setError("Comment content is required");
        return;
      }

      // Try the direct SQL endpoint first
      try {
        console.log('Attempting to update comment with direct SQL endpoint...');
        const response = await fetch('/api/forum/direct-update-comment-sql', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            commentId: editingComment.id,
            content: editCommentContent,
            userId: authStatus.user?.id
          })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to update comment with direct SQL');
        }

        console.log('Comment updated successfully with direct SQL endpoint');
        // Show success message
        setSuccessMessage('Comment updated successfully');

        // Reset form
        setEditingComment(null);
        setEditCommentContent("");

        // Refresh post details
        await fetchPostDetails(selectedPost.id);
        return;
      } catch (directError) {
        console.error('Error with direct SQL update:', directError);
        console.log('Falling back to authenticated endpoint...');
      }

      // If direct SQL fails, try the authenticated endpoint
      try {
        console.log('Attempting to update comment with authenticated endpoint...');
        const response = await fetch('/api/forum/update-comment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            commentId: editingComment.id,
            content: editCommentContent
          })
        });

        const data = await response.json();

        if (!response.ok) {
          // If it's an authentication error, try the public endpoint
          if (response.status === 401) {
            console.log('Authentication error, trying public endpoint...');
            throw new Error('Authentication required, trying public endpoint');
          }
          throw new Error(data.error || 'Failed to update comment');
        }

        console.log('Comment updated successfully with authenticated endpoint');
        // Show success message
        setSuccessMessage('Comment updated successfully');

        // Reset form
        setEditingComment(null);
        setEditCommentContent("");

        // Refresh post details
        await fetchPostDetails(selectedPost.id);
        return;
      } catch (authError) {
        console.error('Error with authenticated update:', authError);
        console.log('Falling back to public update endpoint...');
      }

      // If we get here, try the public endpoint as a last resort
      const publicResponse = await fetch('/api/forum/public-update-comment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          commentId: editingComment.id,
          content: editCommentContent
        })
      });

      const publicData = await publicResponse.json();

      if (!publicResponse.ok) {
        throw new Error(publicData.error || 'Failed to update comment with public endpoint');
      }

      console.log('Comment updated successfully with public endpoint');
      // Show success message
      setSuccessMessage('Comment updated successfully');

      // Reset form
      setEditingComment(null);
      setEditCommentContent("");

      // Refresh post details
      await fetchPostDetails(selectedPost.id);
    } catch (error) {
      console.error('Error updating comment:', error);
      setError(error.message || 'Could not update comment. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      if (!confirm('Are you sure you want to delete this comment? This action cannot be undone.')) {
        return;
      }

      setLoading(true);
      setError(null);
      setSuccessMessage(null);

      // First try the authenticated endpoint
      try {
        console.log('Attempting to delete comment with authenticated endpoint...');
        const response = await fetch('/api/forum/delete-comment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ commentId })
        });

        const data = await response.json();

        if (!response.ok) {
          // If it's an authentication error, try the public endpoint
          if (response.status === 401) {
            console.log('Authentication error, trying public endpoint...');
            throw new Error('Authentication required, trying public endpoint');
          }
          throw new Error(data.error || 'Failed to delete comment');
        }

        console.log('Comment deleted successfully with authenticated endpoint');
        // Show success message
        setSuccessMessage('Comment deleted successfully');

        // Refresh post details
        await fetchPostDetails(selectedPost.id);
        return;
      } catch (authError) {
        console.error('Error with authenticated delete:', authError);
        console.log('Falling back to public delete endpoint...');
      }

      // If we get here, try the public endpoint
      const publicResponse = await fetch('/api/forum/public-delete-comment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ commentId })
      });

      const publicData = await publicResponse.json();

      if (!publicResponse.ok) {
        throw new Error(publicData.error || 'Failed to delete comment with public endpoint');
      }

      console.log('Comment deleted successfully with public endpoint');
      // Show success message
      setSuccessMessage('Comment deleted successfully');

      // Refresh post details
      await fetchPostDetails(selectedPost.id);
    } catch (error) {
      console.error('Error deleting comment:', error);
      setError(error.message || 'Could not delete comment. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = () => {
    // Store the current post ID if we're viewing a post
    if (selectedPost) {
      localStorage.setItem('lastViewedPostId', selectedPost.id);
    }
    window.location.href = `/account/signin?callbackUrl=${encodeURIComponent("/community")}`;
  };

  // Check for a stored post ID on component mount
  useEffect(() => {
    const lastViewedPostId = localStorage.getItem('lastViewedPostId');
    if (lastViewedPostId) {
      // Clear the stored ID
      localStorage.removeItem('lastViewedPostId');
      // Fetch the post details
      fetchPostDetails(lastViewedPostId);
    }
  }, []);

  // Show loading state while checking authentication
  if (authStatus.checking) {
    return (
      <GlassContainer className="flex items-center justify-center">
        <ModernSpinner size="large" />
      </GlassContainer>
    );
  }

  return (
    <GlassContainer>
      <BackButton />

      <div className="mb-6 flex items-center justify-between">
        <ModernHeading level={1}>Community Forum</ModernHeading>
        <ModernButton
          onClick={() => authStatus.authenticated ? setShowNewPostForm(true) : handleSignIn()}
        >
          New Post
        </ModernButton>
      </div>

      {!authStatus.authenticated && (
        <ModernAlert type="info" className="mb-4">
          <p>You're viewing the forum as a guest. <button onClick={handleSignIn} className="font-bold underline">Sign in</button> to create posts and participate in discussions.</p>
        </ModernAlert>
      )}

      {authStatus.authenticated && (
        <ModernAlert type="info" className="mb-4 flex items-start gap-2">
          <span className="text-blue-500 text-lg mt-0.5">ℹ️</span>
          <div>
            <p>All new posts require admin approval before they appear to other users. <span className="text-blue-600">Thanks for your patience!</span></p>
            <p className="mt-1 text-sm">Your posts will be marked with <span className="bg-amber-100 text-amber-800 text-xs px-2 py-0.5 rounded-full font-medium">Pending Approval</span> until they're reviewed. Only you can see your pending posts.</p>
          </div>
        </ModernAlert>
      )}

      {error && (
        <ModernAlert type="error" className="mb-4">
          <p className="font-bold">Error:</p>
          <p>{error}</p>
          {error.includes('Authentication required') && (
            <div className="mt-2">
              <ModernButton onClick={handleSignIn} variant="secondary">
                Sign In
              </ModernButton>
            </div>
          )}
        </ModernAlert>
      )}

      {successMessage && (
        <ModernAlert type="success" className="mb-4">
          <p className="font-bold">Success:</p>
          <p>{successMessage}</p>
        </ModernAlert>
      )}

      {showNewPostForm && (
        <GlassCard className="mb-6">
          <form onSubmit={handleCreatePost}>
            <div className="mb-4">
              <ModernInput
                type="text"
                value={newPost.title}
                onChange={(e) =>
                  setNewPost({ ...newPost, title: e.target.value })
                }
                placeholder="Post Title"
                required
              />
            </div>
            <div className="mb-4">
              <ModernTextarea
                value={newPost.content}
                onChange={(e) =>
                  setNewPost({ ...newPost, content: e.target.value })
                }
                placeholder="Write your post..."
                rows={5}
                required
              />
            </div>
            <div className="flex justify-end space-x-2">
              <ModernButton
                type="button"
                onClick={() => setShowNewPostForm(false)}
                variant="outline"
              >
                Cancel
              </ModernButton>
              <ModernButton
                type="submit"
              >
                Post
              </ModernButton>
            </div>
          </form>
        </GlassCard>
      )}

      {loading ? (
        <div className="flex justify-center py-8">
          <ModernSpinner size="large" />
        </div>
      ) : selectedPost ? (
        <GlassCard>
          <ModernButton
            onClick={() => {
              setSelectedPost(null);
            }}
            variant="outline"
            className="mb-4"
          >
            ← Back to Posts
          </ModernButton>

          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ModernHeading level={2}>
                {selectedPost.title}
              </ModernHeading>
              {!selectedPost.is_approved && (
                <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm font-medium">
                  Pending Admin Approval
                </span>
              )}
            </div>
            {authStatus.authenticated && authStatus.user && selectedPost.user_id === authStatus.user.id && (
              <div className="flex space-x-2">
                <ModernButton
                  onClick={() => handleEditPost(selectedPost)}
                  variant="secondary"
                  className="text-sm px-3 py-1"
                >
                  Edit
                </ModernButton>
                <ModernButton
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeletePost(selectedPost.id);
                  }}
                  variant="outline"
                  className="text-sm px-3 py-1 text-red-600 border-red-200 hover:bg-red-50"
                >
                  Delete
                </ModernButton>
              </div>
            )}
          </div>
          <div className="mb-4 text-sm text-gray-600">
            Posted by {selectedPost.author_name} on{" "}
            {new Date(selectedPost.created_at).toLocaleDateString()}
          </div>

          {editingPost && editingPost.id === selectedPost.id ? (
            <GlassCard className="mb-8">
              <form onSubmit={handleUpdatePost}>
                <div className="mb-4">
                  <ModernInput
                    type="text"
                    value={editFormData.title}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, title: e.target.value })
                    }
                    placeholder="Post Title"
                    required
                  />
                </div>
                <div className="mb-4">
                  <ModernTextarea
                    value={editFormData.content}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, content: e.target.value })
                    }
                    placeholder="Write your post..."
                    rows={5}
                    required
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <ModernButton
                    type="button"
                    onClick={handleCancelEdit}
                    variant="outline"
                  >
                    Cancel
                  </ModernButton>
                  <ModernButton
                    type="submit"
                  >
                    Update Post
                  </ModernButton>
                </div>
              </form>
            </GlassCard>
          ) : (
            <p className="mb-8 text-gray-700">{selectedPost.content}</p>
          )}

          <div className="border-t pt-6">
            <ModernHeading level={3} className="mb-4">Comments</ModernHeading>
            {authStatus.authenticated ? (
              <form onSubmit={handleCreateComment} className="mb-6">
                <ModernTextarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Write a comment..."
                  className="mb-2"
                  rows={4}
                  required
                />
                <ModernButton
                  type="submit"
                >
                  Add Comment
                </ModernButton>
              </form>
            ) : (
              <ModernAlert type="info" className="mb-6">
                <p><button onClick={handleSignIn} className="font-bold underline">Sign in</button> to add comments to this post.</p>
              </ModernAlert>
            )}

            <div className="space-y-4">
              {selectedPost.comments?.map((comment) => (
                <ModernCard
                  key={comment.id}
                  className="bg-gray-50/80 backdrop-blur-sm hover:bg-white/80 transition-all duration-300"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="text-sm text-gray-600">
                      {comment.author_name} -{" "}
                      {new Date(comment.created_at).toLocaleDateString()}
                    </div>
                    {authStatus.authenticated && authStatus.user && comment.user_id === authStatus.user.id && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditComment(comment)}
                          className="text-xs text-blue-600 hover:text-blue-800"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          className="text-xs text-red-600 hover:text-red-800"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>

                  {editingComment && editingComment.id === comment.id ? (
                    <form onSubmit={handleUpdateComment} className="mt-2">
                      <ModernTextarea
                        value={editCommentContent}
                        onChange={(e) => setEditCommentContent(e.target.value)}
                        className="mb-2"
                        rows={3}
                        required
                      />
                      <div className="flex justify-end space-x-2">
                        <ModernButton
                          type="button"
                          onClick={handleCancelEditComment}
                          variant="outline"
                          className="text-xs px-2 py-1"
                        >
                          Cancel
                        </ModernButton>
                        <ModernButton
                          type="submit"
                          className="text-xs px-2 py-1"
                        >
                          Update
                        </ModernButton>
                      </div>
                    </form>
                  ) : (
                    <p className="text-gray-700">{comment.content}</p>
                  )}
                </ModernCard>
              ))}
            </div>
          </div>
        </GlassCard>
      ) : (
        <div className="space-y-4">
          {posts.length > 0 ? (
            posts.map((post) => (
              <GlassCard
                key={post.id}
                className={`cursor-pointer transition-all duration-300 hover:scale-[1.01] hover:shadow-2xl ${!post.is_approved ? 'border-l-4 border-l-amber-400' : ''}`}
                onClick={() => fetchPostDetails(post.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <ModernHeading level={2} className="mb-0">
                        {post.title}
                      </ModernHeading>
                      {!post.is_approved && (
                        <span className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full font-medium">
                          Pending Approval
                        </span>
                      )}
                    </div>
                    <div className="mb-2 text-sm text-gray-600">
                      Posted by {post.author_name} on{" "}
                      {new Date(post.created_at).toLocaleDateString()}
                    </div>
                    <p className="text-gray-700">
                      {post.content && post.content.length > 200
                        ? `${post.content.substring(0, 200)}...`
                        : post.content}
                    </p>
                  </div>
                  {authStatus.authenticated && authStatus.user && post.user_id === authStatus.user.id && (
                    <div className="ml-4 flex space-x-2">
                      <ModernButton
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditPost(post);
                        }}
                        variant="secondary"
                        className="text-sm px-3 py-1"
                      >
                        Edit
                      </ModernButton>
                      <ModernButton
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeletePost(post.id);
                        }}
                        variant="outline"
                        className="text-sm px-3 py-1 text-red-600 border-red-200 hover:bg-red-50"
                      >
                        Delete
                      </ModernButton>
                    </div>
                  )}
                </div>
              </GlassCard>
            ))
          ) : (
            <GlassCard className="text-center p-8 relative overflow-hidden">
              {/* Gradient background glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 opacity-70"></div>
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(147,197,253,0.15),transparent_70%)] animate-pulse-subtle"></div>

              <div className="relative z-10 flex flex-col items-center">
                {/* Character Illustration */}
                <div className="mb-6 w-40 h-40 relative stagger-item animate-fade-in">
                  <img
                    src="/illustrations/conversation.svg"
                    alt="People chatting"
                    className="w-full h-full object-contain animate-pulse-subtle"
                  />
                </div>

                <div className="stagger-item animate-slide-up">
                  <h3 className="text-2xl font-semibold text-gray-800 mb-3">
                    Looks like it's quiet here...
                  </h3>

                  <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    Why not break the ice? Share a thought, question, or kind word — someone out there needs it.
                  </p>
                </div>

                <div className="flex items-center justify-center mb-6 text-sm text-gray-500 stagger-item animate-slide-up">
                  <div className="flex -space-x-2 mr-3">
                    <div className="w-8 h-8 rounded-full bg-blue-400 flex items-center justify-center text-white text-xs shadow-md">
                      😊
                    </div>
                    <div className="w-8 h-8 rounded-full bg-purple-400 flex items-center justify-center text-white text-xs shadow-md">
                      🙂
                    </div>
                    <div className="w-8 h-8 rounded-full bg-pink-400 flex items-center justify-center text-white text-xs shadow-md">
                      😄
                    </div>
                  </div>
                  <span>People are waiting to hear from you...</span>
                </div>

                <ModernButton
                  onClick={() => authStatus.authenticated ? setShowNewPostForm(true) : handleSignIn()}
                  className="mb-8 relative group stagger-item animate-slide-up hover:scale-105 transition-transform duration-300"
                >
                  <span className="relative z-10">Create Post</span>
                  <span className="absolute inset-0 rounded-md bg-gradient-to-r from-blue-500 to-indigo-500 opacity-0 group-hover:opacity-100 blur transition-opacity duration-300"></span>
                </ModernButton>

                {/* Thought bubble style suggestions */}
                <div className="relative mt-4 max-w-md mx-auto stagger-item animate-slide-up">
                  <div className="absolute -top-6 -right-2 w-6 h-6 rounded-full bg-yellow-100 border border-yellow-200"></div>
                  <div className="absolute -top-3 right-2 w-4 h-4 rounded-full bg-yellow-100 border border-yellow-200"></div>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-5 text-sm shadow-sm">
                    <div className="flex items-center mb-2">
                      <span className="text-lg mr-2">✍️</span>
                      <span className="font-medium text-yellow-800">You could start by sharing:</span>
                    </div>
                    <ul className="text-left space-y-2 pl-7 text-gray-700">
                      <li className="relative">
                        <span className="absolute -left-5">•</span>
                        <em>How you're feeling today</em>
                      </li>
                      <li className="relative">
                        <span className="absolute -left-5">•</span>
                        <em>A challenge you're facing</em>
                      </li>
                      <li className="relative">
                        <span className="absolute -left-5">•</span>
                        <em>Something that helped you recently</em>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Sample post examples */}
                <div className="mt-8 w-full max-w-md mx-auto opacity-60 stagger-item animate-slide-up">
                  <p className="text-xs text-gray-500 mb-2 text-left">Sample discussions:</p>
                  <div className="bg-white/50 backdrop-blur-sm rounded-md p-3 mb-2 text-left border border-gray-100 shadow-sm">
                    <p className="text-gray-400 text-sm font-medium">Feeling anxious about my new job...</p>
                  </div>
                  <div className="bg-white/50 backdrop-blur-sm rounded-md p-3 text-left border border-gray-100 shadow-sm">
                    <p className="text-gray-400 text-sm font-medium">What's your favorite way to relax after a stressful day?</p>
                  </div>
                </div>
              </div>
            </GlassCard>
          )}
        </div>
      )}
    </GlassContainer>
  );
}

export default CommunityPage;
