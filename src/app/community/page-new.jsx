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
      // Clear any previous state
      setLoading(true);
      setError(null);
      setSuccessMessage(null);

      // Add a delay to ensure loading state is visible
      await new Promise(resolve => setTimeout(resolve, 300));

      console.log('Fetching post details for ID:', postId);

      if (!postId) {
        console.error('Invalid post ID:', postId);
        setError('Invalid post ID');
        setLoading(false);
        return null;
      }

      // Force clear any previous selected post to ensure UI updates
      setSelectedPost(null);

      // First try using the API endpoint
      try {
        console.log('Attempting to fetch post details using API endpoint...');
        const response = await fetch(`/api/forum/direct-view-post?id=${postId}`);

        if (response.ok) {
          const data = await response.json();
          console.log('Post details fetched from API:', data);

          if (data.success && data.post) {
            // Get the current user for permission checks
            const { data: { session } } = await supabase.auth.getSession();
            const currentUserId = session?.user?.id;

            // Add author_name if not present
            if (!data.post.author_name) {
              data.post.author_name = 'Anonymous';
            }

            // Format comments with author names if needed
            const formattedComments = (data.comments || []).map(comment => ({
              ...comment,
              author_name: comment.author_name || 'Anonymous'
            }));

            // Set the selected post with comments
            const formattedPost = {
              ...data.post,
              comments: formattedComments
            };

            console.log('Setting selected post:', formattedPost);

            // Set the selected post and ensure the UI updates
            setSelectedPost(formattedPost);
            console.log('Selected post state set to:', formattedPost.id);

            setLoading(false);
            return formattedPost;
          }
        }
      } catch (apiError) {
        console.error('Error using API endpoint:', apiError);
        console.log('Falling back to direct database query...');
      }

      // Direct database query for post as fallback
      const { data: post, error: postError } = await supabase
        .from('discussion_posts')
        .select('*')
        .eq('id', postId)
        .single();

      if (postError) {
        console.error('Error fetching post:', postError);
        throw new Error('Failed to fetch post: ' + postError.message);
      }

      console.log('Post fetched successfully:', post);

      // Try to get author information
      let authorName = 'Anonymous';
      if (post.user_id) {
        const { data: author } = await supabase
          .from('user_profiles')
          .select('display_name')
          .eq('id', post.user_id)
          .single();

        if (author?.display_name) {
          authorName = author.display_name;
        }
      }

      // Direct database query for comments
      const { data: comments, error: commentsError } = await supabase
        .from('discussion_comments')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (commentsError) {
        console.error('Error fetching comments:', commentsError);
        // Continue without comments
      }

      console.log('Comments fetched:', comments ? comments.length : 0);

      // Format comments with author names
      const formattedComments = [];
      if (comments && comments.length > 0) {
        // Get all user IDs from comments
        const userIds = comments.map(c => c.user_id).filter(Boolean);

        // Get display names for all users
        const { data: commentAuthors } = await supabase
          .from('user_profiles')
          .select('id, display_name')
          .in('id', userIds);

        // Create a map of user_id to display_name
        const authorMap = {};
        if (commentAuthors) {
          commentAuthors.forEach(author => {
            authorMap[author.id] = author.display_name;
          });
        }

        // Format comments with author names
        formattedComments.push(...comments.map(comment => ({
          ...comment,
          author_name: comment.user_id && authorMap[comment.user_id] ?
            authorMap[comment.user_id] : 'Anonymous'
        })));
      }

      // Create the formatted post object
      const formattedPost = {
        ...post,
        author_name: authorName,
        comments: formattedComments
      };

      console.log('Setting selected post from direct query:', formattedPost);

      // Set the selected post with comments
      setSelectedPost(formattedPost);
      console.log('Selected post state set to:', formattedPost.id);

      // Add a small delay to ensure state updates before returning
      await new Promise(resolve => setTimeout(resolve, 100));

      return formattedPost;
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

      console.log('Creating comment for post:', selectedPost.id);
      console.log('Comment content:', newComment);
      console.log('User ID:', session.user.id);

      // Direct database insert
      console.log('Adding comment with direct database access...');
      const { data, error } = await supabase
        .from('discussion_comments')
        .insert({
          post_id: selectedPost.id,
          user_id: session.user.id,
          content: newComment,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select();

      if (error) {
        console.error('Error adding comment:', error);
        throw new Error('Failed to add comment: ' + error.message);
      }

      console.log('Comment added successfully:', data);

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
    console.log('handleEditPost called with post:', post);
    // First fetch the post details to ensure we have the latest data
    fetchPostDetails(post.id).then(() => {
      // Now set the editing state with the fetched post
      setEditingPost(post);
      setEditFormData({
        title: post.title,
        content: post.content
      });
      console.log('Edit form data set:', { title: post.title, content: post.content });
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

      if (!editingPost || !editingPost.id) {
        console.error('No post is being edited or missing post ID');
        setError("Cannot update post: missing post information");
        return;
      }

      console.log('Updating post with ID:', editingPost.id);
      console.log('Update data:', editFormData);

      // First try using the API endpoint
      try {
        console.log('Attempting to update post using API endpoint...');
        // Get the current user ID from the session
        const { data: { session } } = await supabase.auth.getSession();
        const currentUserId = session?.user?.id;

        if (!currentUserId) {
          console.error('No user ID available for edit');
          throw new Error('Authentication required to edit posts');
        }

        console.log('Using user ID for edit:', currentUserId);

        const response = await fetch('/api/forum/public-edit-post', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            id: editingPost.id,
            title: editFormData.title,
            content: editFormData.content,
            userId: currentUserId
          })
        });

        const data = await response.json();

        if (response.ok && data.success) {
          console.log('Post updated successfully via API:', data);
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
        } else {
          console.error('API update failed:', data.error || 'Unknown error');
          console.log('Falling back to direct database update...');
        }
      } catch (apiError) {
        console.error('Error using API endpoint for update:', apiError);
        console.log('Falling back to direct database update...');
      }

      // Direct database update as fallback
      console.log('Updating post with direct database access...');
      const { data, error } = await supabase
        .from('discussion_posts')
        .update({
          title: editFormData.title,
          content: editFormData.content,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingPost.id)
        .select();

      if (error) {
        console.error('Error updating post:', error);
        throw new Error('Failed to update post: ' + error.message);
      }

      console.log('Post updated successfully with direct database access:', data);
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

      // Direct database update
      console.log('Updating comment with direct database access...');
      const { data, error } = await supabase
        .from('discussion_comments')
        .update({
          content: editCommentContent,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingComment.id)
        .select();

      if (error) {
        console.error('Error updating comment:', error);
        throw new Error('Failed to update comment: ' + error.message);
      }

      console.log('Comment updated successfully:', data);
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

  // Direct method to view post details with simplified approach
  const viewPostDirectly = async (postId) => {
    try {
      setLoading(true);
      setError(null);
      setSuccessMessage(null);

      console.log('Directly viewing post with ID:', postId);

      // Get the post directly from the database
      const { data: post, error: postError } = await supabase
        .from('discussion_posts')
        .select('*')
        .eq('id', postId)
        .single();

      if (postError) {
        console.error('Error fetching post:', postError);
        setError('Could not load post. Please try again.');
        setLoading(false);
        return;
      }

      console.log('Post fetched successfully:', post);

      // Create a simplified post object
      const viewPost = {
        ...post,
        author_name: 'Anonymous',
        comments: []
      };

      // Set the selected post
      console.log('Setting selected post directly:', viewPost);
      setSelectedPost(viewPost);

      // Fetch comments in the background
      supabase
        .from('discussion_comments')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true })
        .then(({ data: comments }) => {
          if (comments && comments.length > 0) {
            console.log('Comments fetched:', comments.length);
            // Update the post with comments
            setSelectedPost(prev => ({
              ...prev,
              comments: comments.map(c => ({ ...c, author_name: 'Anonymous' }))
            }));
          }
        })
        .catch(err => {
          console.error('Error fetching comments:', err);
        });

      setLoading(false);
    } catch (error) {
      console.error('Error in viewPostDirectly:', error);
      setError('An error occurred while loading the post.');
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
      // Use our direct method to view the post
      console.log('Found stored post ID, viewing directly:', lastViewedPostId);
      viewPostDirectly(lastViewedPostId);
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
        <GlassCard className="flex flex-col items-center justify-center py-12">
          <ModernSpinner size="large" />
          <p className="mt-4 text-gray-600">Loading post details...</p>
        </GlassCard>
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
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log('Edit button clicked for selected post:', selectedPost.id);
                    handleEditPost(selectedPost);
                  }}
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
            Posted by {selectedPost.author_name || 'Anonymous'} on{" "}
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
                      {comment.author_name || 'Anonymous'} -{" "}
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
                className={`transition-all duration-300 hover:scale-[1.01] hover:shadow-2xl hover:bg-blue-50/30 ${!post.is_approved ? 'border-l-4 border-l-amber-400' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <ModernHeading level={2} className="mb-0">
                        <span
                          className="text-blue-600 hover:underline cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            console.log('Post title clicked, viewing post directly:', post.id);
                            viewPostDirectly(post.id);
                          }}
                        >
                          {post.title}
                        </span>
                      </ModernHeading>
                      {!post.is_approved && (
                        <span className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full font-medium">
                          Pending Approval
                        </span>
                      )}
                    </div>
                    <div className="mb-2 text-sm text-gray-600">
                      Posted by {post.author_name || 'Anonymous'} on{" "}
                      {new Date(post.created_at).toLocaleDateString()}
                    </div>
                    <p className="text-gray-700">
                      {post.content && post.content.length > 200
                        ? `${post.content.substring(0, 200)}...`
                        : post.content}
                    </p>
                    <div className="mt-4">
                      <ModernButton
                        onClick={() => {
                          console.log('View Details button clicked for post:', post.id);
                          // Use a direct method to view post details
                          viewPostDirectly(post.id);
                        }}
                        variant="secondary"
                        className="text-sm px-3 py-1"
                      >
                        View Details
                      </ModernButton>
                    </div>
                  </div>
                  {authStatus.authenticated && authStatus.user && post.user_id === authStatus.user.id && (
                    <div className="ml-4 flex space-x-2">
                      <ModernButton
                        onClick={(e) => {
                          e.stopPropagation();
                          console.log('Edit button clicked for post:', post.id);
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
