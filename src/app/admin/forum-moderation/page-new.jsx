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
  const [filterType, setFilterType] = useState("all"); // "all", "flagged", "reported", "pending"
  const [selectedPost, setSelectedPost] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (user) {
      checkAdminStatus();
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      // Automatically load posts when the component mounts or filter changes
      loadPosts();
    }
  }, [user, filterType]);

  // Add another useEffect to automatically load posts when the page loads
  useEffect(() => {
    if (user && posts.length === 0 && !loading) {
      console.log('Initial load - calling loadPosts()');
      loadPosts();
    }
  }, [user, posts.length, loading]);

  // Add a direct call to ensure forum tables exist when component mounts
  useEffect(() => {
    if (user) {
      console.log('Component mounted - ensuring forum tables exist');
      ensureForumTablesExist();

      // Also directly check if forum_posts table exists and has data
      checkForumPostsTable();
    }
  }, [user]);

  // Function to directly check if discussion_posts table exists and has data
  const checkForumPostsTable = async () => {
    try {
      console.log('Directly checking discussion_posts table...');
      // First check if the table exists
      const { data: tableCheck, error: tableError } = await supabase.rpc('exec_sql', {
        sql: `
          SELECT EXISTS (
            SELECT FROM pg_tables
            WHERE schemaname = 'public'
            AND tablename = 'discussion_posts'
          ) as table_exists;
        `
      });

      if (tableError) {
        console.error('Error checking if discussion_posts table exists:', tableError);
        return;
      }

      const tableExists = tableCheck && tableCheck[0] && tableCheck[0].table_exists;
      console.log('discussion_posts table exists:', tableExists);

      if (!tableExists) {
        console.log('discussion_posts table does not exist, will create it');
        return;
      }

      // If table exists, check post count
      const { data: countData, error: countError } = await supabase.rpc('exec_sql', {
        sql: `SELECT COUNT(*) as post_count FROM discussion_posts;`
      });

      if (countError) {
        console.error('Error checking discussion_posts post count:', countError);
        return;
      }

      console.log('Discussion posts count result:', countData);

      if (countData && countData[0]) {
        const postCount = parseInt(countData[0].post_count);
        console.log(`discussion_posts table has ${postCount} posts`);

        if (postCount === 0) {
          console.log('discussion_posts table exists but has no posts');
          // Create a test post
          createTestPost();
        }
      }
    } catch (err) {
      console.error('Error in checkForumPostsTable:', err);
    }
  };

  // Function to create a test post
  const createTestPost = async () => {
    try {
      console.log('Creating a test post...');
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        console.log('No session, cannot create test post');
        return;
      }

      const { error } = await supabase
        .from('discussion_posts')
        .insert({
          user_id: session.user.id,
          title: 'Welcome to the Forum',
          content: 'This is a test post to verify that the forum is working correctly.',
          is_flagged: true,
          report_count: 1,
          is_approved: false
        });

      if (error) {
        console.error('Error creating test post:', error);
      } else {
        console.log('Test post created successfully');
        // Reload posts
        loadPosts();
      }
    } catch (err) {
      console.error('Error in createTestPost:', err);
    }
  };

  // Function to directly ensure forum tables exist
  const ensureForumTablesExist = async () => {
    try {
      console.log('Checking if discussion_posts table exists...');
      const { data, error } = await supabase.rpc('exec_sql', {
        sql: `
          SELECT EXISTS (
            SELECT FROM pg_tables
            WHERE schemaname = 'public'
            AND tablename = 'discussion_posts'
          ) as table_exists;
        `
      });

      if (error) {
        console.error('Error checking if discussion_posts table exists:', error);
        setError('Error checking if discussion_posts table exists: ' + error.message);
        return;
      }

      const tableExists = data && data[0] && data[0].table_exists;
      console.log('discussion_posts table exists:', tableExists);

      if (tableExists) {
        console.log('discussion_posts table already exists, refreshing posts...');
        loadPosts();
      } else {
        console.error('discussion_posts table does not exist');
        setError('discussion_posts table does not exist. Please create it in the Supabase dashboard.');
      }
    } catch (err) {
      console.error('Error ensuring forum tables:', err);
      setError('Error ensuring forum tables: ' + err.message);
    }
  };

  // Function to check and fix schema if needed
  const checkAndFixSchema = async () => {
    try {
      console.log('Checking if schema needs to be fixed...');

      // Try to fetch posts to see if there's a schema issue - check discussion_posts first
      const { data, error } = await supabase
        .from('discussion_posts')
        .select('*')
        .limit(1);

      if (error) {
        console.log('Schema issue detected:', error.message);
        setLoading(true);
        setError('Fixing database schema automatically...');

        // Check if the error is related to missing removal columns
        if (error.message.includes('removal') || error.message.includes('column') ||
            error.message.includes('does not exist') || error.message.includes('relationship')) {
          // Call our API endpoint to add the missing removal columns
          const response = await fetch('/api/forum/add-removal-columns', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            }
          });

          const result = await response.json();
          console.log('Schema fix result:', result);

          if (result.success) {
            console.log('Schema fixed successfully');
            setError('Schema fixed successfully! Refreshing...');

            // Try the query again after fixing the schema
            const { data: retryData, error: retryError } = await supabase
              .from('discussion_posts')
              .select('*')
              .limit(1);

            if (!retryError) {
              console.log('Schema fix resolved the issue!');
              setTimeout(() => {
                setError(null);
                loadPosts();
              }, 1500);
              return true;
            }

            console.log('Schema fix did not resolve the issue, error:', retryError);
            setError('Schema fix did not resolve all issues. Please contact support.');
            return false;
          } else {
            console.error('Failed to fix schema:', result.error);
            setError('Failed to fix schema: ' + (result.error || 'Unknown error'));
            return false;
          }
        } else {
          // For other types of errors, try the general fix-database-schema endpoint
          const { data: { session } } = await supabase.auth.getSession();
          const token = session?.access_token;

          if (!token) {
            throw new Error('Authentication required to fix schema');
          }

          // Call our new API endpoint to fix the database schema
          const response = await fetch('/api/admin/fix-database-schema', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          });

          const result = await response.json();
          console.log('Schema fix result:', result);

          if (result.success) {
            console.log('Schema fixed successfully');
            setError('Schema fixed successfully! Refreshing...');

            // Try the query again after fixing the schema
            const { data: retryData, error: retryError } = await supabase
              .from('discussion_posts')
              .select('*')
              .limit(1);

            if (!retryError) {
              console.log('Schema fix resolved the issue!');
              setTimeout(() => {
                setError(null);
                loadPosts();
              }, 1500);
              return true;
            }

            console.log('Schema fix did not resolve the issue, error:', retryError);
            setError('Schema fix did not resolve all issues. Please contact support.');
            return false;
          } else {
            console.error('Failed to fix schema:', result.error);
            setError('Failed to fix schema: ' + (result.error || 'Unknown error'));
            return false;
          }
        }
      }

      return true;
    } catch (error) {
      console.error('Error checking/fixing schema:', error);
      setError('Error checking/fixing schema: ' + error.message);
      return false;
    }
  };

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
      console.log('loadPosts function called');
      setLoading(true);
      setError(null);

      // Check and fix schema if needed
      console.log('Checking and fixing schema if needed...');
      const schemaOk = await checkAndFixSchema();

      // If schema fix is in progress, return early
      if (!schemaOk) {
        console.log('Schema fix in progress, will reload posts when done');
        return;
      }

      // Get the current auth token
      console.log('Getting auth session...');
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      console.log('Auth session:', session ? 'User is authenticated' : 'No session');

      if (!token) {
        throw new Error('Authentication required');
      }

      // Use discussion_posts table directly instead of checking multiple tables
      let tableName = 'discussion_posts';
      console.log(`Using table: ${tableName}`);

      // Build the query
      console.log('Building query for table:', tableName);
      let query = supabase
        .from(tableName)
        .select('*')
        .order('created_at', { ascending: false });

      // Always exclude removed posts unless we're specifically looking at removed posts
      const hasRemoved = await columnExists(tableName, 'is_removed');
      if (hasRemoved) {
        if (filterType === 'removed') {
          console.log('Showing only removed posts');
          query = query.eq('is_removed', true);
        } else {
          console.log('Excluding removed posts');
          query = query.eq('is_removed', false);
        }
      }

      // Add filter based on the selected filter type
      console.log('Current filter type:', filterType);
      if (filterType === "flagged") {
        console.log('Applying flagged filter');
        query = query.eq('is_flagged', true);
      } else if (filterType === "reported") {
        console.log('Applying reported filter');
        query = query.gt('report_count', 0);
      } else if (filterType === "pending") {
        console.log('Checking if is_approved column exists for pending filter');
        // Check if is_approved column exists
        const hasApproved = await columnExists(tableName, 'is_approved');
        if (hasApproved) {
          console.log('is_approved column exists, applying pending filter');
          query = query.eq('is_approved', false);
        } else {
          console.log('is_approved column does not exist, skipping pending filter');
        }
      } else if (filterType === "removed") {
        // The removed filter is already applied above
        console.log('Removed filter already applied');
      } else {
        console.log('Using "all" filter (no conditions)');
      }
      // For "all" filter type, we don't add any additional conditions

      // Execute the query
      console.log('Executing query...');
      const { data: postData, error: postsError } = await query;
      console.log('Query result:', { postData, postsError });

      if (postsError) {
        console.error('Error fetching forum posts:', postsError);

        // If there's a schema issue, try to fix it and retry
        if (postsError.message.includes('relationship') || postsError.message.includes('does not exist') ||
            postsError.message.includes('column') || postsError.message.includes('removal')) {
          console.log('Detected schema issue, attempting to fix...');
          // Don't wait for the fix to complete - it will refresh the page when done
          checkAndFixSchema();
          // Return early since checkAndFixSchema will reload the posts when done
          return;
        }

        throw new Error('Failed to fetch forum posts: ' + postsError.message);
      }

      // If no posts found, just show empty state
      if (!postData || postData.length === 0) {
        console.log('No posts found');
        setPosts([]);
        setLoading(false);
        return;
      }

      // Log the posts data for debugging
      console.log('Found posts:', postData);

      // Process the posts data
      await processPostsData(postData);
    } catch (err) {
      console.error("Error loading posts:", err);
      setError(err.message || "Failed to load posts");
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to process posts data
  const processPostsData = async (data) => {
    console.log('Processing posts data:', data);
    try {
      if (!data || data.length === 0) {
        console.log('No posts data to process, setting empty posts array');
        setPosts([]);
        return true;
      }

      console.log(`Found ${data.length} posts to process`);

      // Get all user IDs from posts
      const userIds = data.map(post => post.user_id).filter(Boolean);

      if (userIds.length > 0) {
        // Get user profiles for all users
        const { data: profiles, error: profilesError } = await supabase
          .from('user_profiles')
          .select('id, display_name, role')
          .in('id', userIds);

        if (!profilesError && profiles) {
          // Create a map of user_id to profile info
          const userMap = {};
          profiles.forEach(profile => {
            userMap[profile.id] = {
              display_name: profile.display_name,
              role: profile.role
            };
          });

          // Get comment counts for each post individually
          const postIds = data.map(post => post.id);
          const commentMap = {};

          // Initialize all posts with 0 comments
          postIds.forEach(id => {
            commentMap[id] = 0;
          });

          // Count comments for each post
          if (postIds.length > 0) {
            try {
              // Check possible comment table names
              const possibleCommentTables = ['forum_comments', 'discussion_comments', 'comments'];
              let commentTableName = null;
              let allComments = [];

              // Try each table until we find one that exists
              for (const table of possibleCommentTables) {
                console.log(`Checking if ${table} table exists...`);
                const { data: comments, error: commentError } = await supabase
                  .from(table)
                  .select('post_id')
                  .in('post_id', postIds)
                  .limit(1);

                if (!commentError) {
                  console.log(`Found comment table: ${table}`);
                  commentTableName = table;

                  // Now fetch all comments from this table
                  const { data: allTableComments, error: fetchError } = await supabase
                    .from(table)
                    .select('post_id')
                    .in('post_id', postIds);

                  if (!fetchError && allTableComments) {
                    allComments = allTableComments;
                  }

                  break;
                }
              }

              // Process the comments we found (if any)
              if (allComments && allComments.length > 0) {
                // Count comments manually
                allComments.forEach(comment => {
                  if (comment.post_id in commentMap) {
                    commentMap[comment.post_id]++;
                  }
                });
              }
            } catch (countError) {
              console.error('Error counting comments:', countError);
            }
          }

          // Format posts with author information
          const formattedPosts = data.map(post => ({
            ...post,
            author: {
              id: post.user_id,
              display_name: post.user_id && userMap[post.user_id] ?
                userMap[post.user_id].display_name :
                (post.user_id ? 'User ' + post.user_id.substring(0, 6) : 'Unknown User'),
              role: post.user_id && userMap[post.user_id] ?
                userMap[post.user_id].role :
                'user'
            },
            comments: [{ count: commentMap[post.id] || 0 }]
          }));

          setPosts(formattedPosts);
        } else {
          // Format posts with generic user IDs if we can't get profiles
          const simplePosts = data.map(post => ({
            ...post,
            author: {
              id: post.user_id,
              display_name: post.user_id ?
                'User ' + post.user_id.substring(0, 6) :
                'Unknown User',
              role: 'user'
            },
            comments: [{ count: 0 }]
          }));

          setPosts(simplePosts);
        }
      } else {
        // Format posts without author information
        const simplePosts = data.map(post => ({
          ...post,
          author: {
            id: null,
            display_name: 'Unknown User',
            role: 'user'
          },
          comments: [{ count: 0 }]
        }));

        setPosts(simplePosts);
      }

      setError(null);
      return true;
    } catch (error) {
      console.error('Error processing posts data:', error);
      setError('Error processing posts data: ' + error.message);
      return false;
    }
  };

  const handleApprovePost = async (postId) => {
    try {
      console.log('Approving post with ID:', postId);
      setActionLoading(true);

      // Get the current auth token
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        throw new Error('Authentication required');
      }

      // Use discussion_posts table directly
      let tableName = 'discussion_posts';
      console.log(`Using table: ${tableName}`);

      // First, check if the post exists and get its current status
      const { data: postData, error: postError } = await supabase
        .from(tableName)
        .select('*')
        .eq('id', postId)
        .single();

      if (postError) {
        console.error('Error fetching post:', postError);
        throw new Error('Failed to fetch post: ' + postError.message);
      }

      console.log('Current post data:', postData);

      // Check which columns exist
      console.log('Checking which columns exist in the table...');
      const hasFlagged = await columnExists(tableName, 'is_flagged');
      const hasReportCount = await columnExists(tableName, 'report_count');
      const hasModeratedBy = await columnExists(tableName, 'moderated_by');
      const hasModeratedAt = await columnExists(tableName, 'moderated_at');
      const hasApproved = await columnExists(tableName, 'is_approved');
      const hasApprovedBy = await columnExists(tableName, 'approved_by');
      const hasApprovedAt = await columnExists(tableName, 'approved_at');

      console.log('Column check results:', {
        hasFlagged,
        hasReportCount,
        hasModeratedBy,
        hasModeratedAt,
        hasApproved,
        hasApprovedBy,
        hasApprovedAt
      });

      // Build update object based on available columns
      const updateObj = {};
      if (hasFlagged) updateObj.is_flagged = false;
      if (hasReportCount) updateObj.report_count = 0;
      if (hasModeratedBy) updateObj.moderated_by = user.id;
      if (hasModeratedAt) updateObj.moderated_at = new Date().toISOString();

      // Set approval status - always set this even if column check fails
      updateObj.is_approved = true;
      if (hasApprovedBy) updateObj.approved_by = user.id;
      if (hasApprovedAt) updateObj.approved_at = new Date().toISOString();

      console.log('Update object:', updateObj);

      // Update the post
      console.log(`Updating post ${postId} in table ${tableName}...`);
      const { data: updateData, error: updateError } = await supabase
        .from(tableName)
        .update(updateObj)
        .eq('id', postId);

      if (updateError) {
        console.error('Error updating post:', updateError);
        throw new Error('Failed to approve post: ' + updateError.message);
      }

      console.log('Post updated successfully:', updateData);

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

      // Use discussion_posts table directly
      let tableName = 'discussion_posts';
      console.log(`Using table: ${tableName}`);

      // Check which columns exist
      const hasRemoved = await columnExists(tableName, 'is_removed');
      const hasRemovedBy = await columnExists(tableName, 'removed_by');
      const hasRemovedAt = await columnExists(tableName, 'removed_at');

      // Build update object based on available columns
      const updateObj = {};
      if (hasRemoved) updateObj.is_removed = true;
      if (hasRemovedBy) updateObj.removed_by = user.id;
      if (hasRemovedAt) updateObj.removed_at = new Date().toISOString();

      // If none of the columns exist, we need to add them first
      if (Object.keys(updateObj).length === 0) {
        console.log(`Table ${tableName} doesn't have removal columns, adding them...`);
        setError('Adding missing removal columns...');

        // Call our API endpoint to add the missing removal columns
        const response = await fetch('/api/forum/add-removal-columns', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        const result = await response.json();
        console.log('Schema fix result:', result);

        if (result.success) {
          console.log('Removal columns added successfully');
          setError('Removal columns added successfully! Refreshing...');

          // Now we can set the update object with the new columns
          updateObj.is_removed = true;
          updateObj.removed_by = user.id;
          updateObj.removed_at = new Date().toISOString();
        } else {
          throw new Error(`Failed to add removal columns: ${result.error || 'Unknown error'}`);
        }
      }

      // Update the post
      const { error: updateError } = await supabase
        .from(tableName)
        .update(updateObj)
        .eq('id', postId);

      if (updateError) {
        throw new Error('Failed to remove post: ' + updateError.message);
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

  const handleRestorePost = async (postId) => {
    try {
      setActionLoading(true);

      // Get the current auth token
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        throw new Error('Authentication required');
      }

      // Use discussion_posts table directly
      let tableName = 'discussion_posts';
      console.log(`Using table: ${tableName}`);

      // Check which columns exist
      const hasRemoved = await columnExists(tableName, 'is_removed');

      if (!hasRemoved) {
        throw new Error('Cannot restore post: is_removed column does not exist');
      }

      // Build update object to restore the post
      const updateObj = {
        is_removed: false,
        removed_by: null,
        removed_at: null,
        removal_reason: null
      };

      // Update the post
      const { error: updateError } = await supabase
        .from(tableName)
        .update(updateObj)
        .eq('id', postId);

      if (updateError) {
        throw new Error('Failed to restore post: ' + updateError.message);
      }

      // Refresh the posts
      await loadPosts();
      setSelectedPost(null);
    } catch (err) {
      console.error("Error restoring post:", err);
      setError(err.message || "Failed to restore post");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateTestPost = async () => {
    try {
      setActionLoading(true);
      setError('Creating test post...');

      // Get the current auth token
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        throw new Error('Authentication required');
      }

      // Use discussion_posts table directly
      let tableName = 'discussion_posts';
      console.log(`Using table: ${tableName}`);

      // Create a test post
      const { error: createError } = await supabase
        .from(tableName)
        .insert({
          user_id: user.id,
          title: 'Test Post',
          content: 'This is a test post created manually.',
          is_flagged: false,
          report_count: 0,
          is_approved: true
        });

      if (createError) {
        console.error('Error creating test post:', createError);
        throw new Error('Failed to create test post: ' + createError.message);
      }

      // Refresh the posts
      setError('Test post created successfully! Refreshing...');
      setTimeout(() => {
        setError(null);
        loadPosts();
      }, 1500);
    } catch (err) {
      console.error("Error creating test post:", err);
      setError(err.message || "Failed to create test post");
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

      // Use discussion_posts table directly
      let tableName = 'discussion_posts';
      console.log(`Using table: ${tableName}`);

      // Check which columns exist
      let hasPinned = await columnExists(tableName, 'is_pinned');
      let hasPinnedBy = await columnExists(tableName, 'pinned_by');
      let hasPinnedAt = await columnExists(tableName, 'pinned_at');

      // If the pinned column doesn't exist, we need to add it first
      if (!hasPinned) {
        console.log(`Table ${tableName} doesn't have an is_pinned column, adding it...`);
        setError('Adding missing pinned columns...');

        // Call our API endpoint to add the missing columns
        const response = await fetch('/api/forum/add-removal-columns', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        const result = await response.json();
        console.log('Schema fix result:', result);

        if (result.success) {
          console.log('Pinned columns added successfully');
          setError('Pinned columns added successfully! Refreshing...');

          // Now we can set hasPinned to true
          hasPinned = true;
          hasPinnedBy = await columnExists(tableName, 'pinned_by');
          hasPinnedAt = await columnExists(tableName, 'pinned_at');
        } else {
          throw new Error(`Failed to add pinned columns: ${result.error || 'Unknown error'}`);
        }
      }

      // Get the current pin status
      const { data: postData, error: postError } = await supabase
        .from(tableName)
        .select('is_pinned')
        .eq('id', postId)
        .single();

      if (postError) {
        throw new Error('Failed to fetch post: ' + postError.message);
      }

      // Build update object based on available columns
      const updateObj = {
        is_pinned: !postData.is_pinned
      };

      if (hasPinnedBy) {
        updateObj.pinned_by = !postData.is_pinned ? user.id : null;
      }

      if (hasPinnedAt) {
        updateObj.pinned_at = !postData.is_pinned ? new Date().toISOString() : null;
      }

      // Toggle the pin status
      const { error: updateError } = await supabase
        .from(tableName)
        .update(updateObj)
        .eq('id', postId);

      if (updateError) {
        throw new Error('Failed to update pin status: ' + updateError.message);
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

  // Helper function to check if a table exists
  const tableExists = async (tableName) => {
    console.log(`Checking if table ${tableName} exists...`);
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);

      return !error;
    } catch (err) {
      console.error(`Error checking if table ${tableName} exists:`, err);
      return false;
    }
  };

  // Helper function to check if a column exists in a table
  const columnExists = async (tableName, columnName) => {
    console.log(`Checking if column ${columnName} exists in table ${tableName}...`);
    try {
      // First check if the table exists
      const { data: tableExists, error: tableError } = await supabase.rpc('exec_sql', {
        sql: `SELECT EXISTS (
          SELECT FROM pg_tables
          WHERE schemaname = 'public'
          AND tablename = '${tableName}'
        );`
      });

      if (tableError) {
        console.error(`Error checking if table ${tableName} exists:`, tableError);
        return false;
      }

      if (!tableExists || !tableExists[0] || !tableExists[0].exists) {
        console.log(`Table ${tableName} does not exist`);
        return false;
      }

      console.log(`Table ${tableName} exists, checking column ${columnName}...`);

      // Check if the column exists in the table's information schema
      const { data: columnData, error: columnError } = await supabase.rpc('exec_sql', {
        sql: `
          SELECT EXISTS (
            SELECT FROM information_schema.columns
            WHERE table_schema = 'public'
            AND table_name = '${tableName}'
            AND column_name = '${columnName}'
          ) as column_exists;
        `
      });

      if (columnError) {
        console.error(`Error checking if column ${columnName} exists:`, columnError);
        return false;
      }

      const columnExists = columnData && columnData[0] && columnData[0].column_exists;
      console.log(`Column ${columnName} ${columnExists ? 'exists' : 'does not exist'} in table ${tableName}`);
      return columnExists;
    } catch (err) {
      console.error(`Error checking if column ${columnName} exists in ${tableName}:`, err);
      return false;
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

        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Forum Moderation</h1>
          <p className="text-gray-600">You can view and moderate all forum posts directly from this page. Select a post to see details and perform moderation actions.</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 p-4 rounded-lg text-red-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold mb-1">Status:</p>
                <p>{error}</p>
              </div>
              {error.includes('contact support') && (
                <Link
                  href="/admin/fix-forum"
                  className="px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm inline-flex items-center"
                >
                  Advanced Fix Options
                </Link>
              )}
            </div>
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
            <button
              onClick={() => setFilterType("pending")}
              className={`px-4 py-2 rounded-lg text-sm ${
                filterType === "pending"
                  ? "bg-indigo-600 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              Pending Approval
            </button>
            <button
              onClick={() => setFilterType("removed")}
              className={`px-4 py-2 rounded-lg text-sm ${
                filterType === "removed"
                  ? "bg-indigo-600 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              Removed Posts
            </button>
          </div>

          <div className="flex space-x-2">
            <button
              onClick={() => {
                setLoading(true);
                loadPosts();
              }}
              className="rounded-lg bg-white px-4 py-2 text-gray-600 hover:bg-gray-50 flex items-center gap-2"
              disabled={loading}
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Refreshing...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh Posts
                </>
              )}
            </button>

            {posts.length === 0 && (
              <button
                onClick={handleCreateTestPost}
                className="rounded-lg bg-white px-4 py-2 text-gray-500 hover:bg-gray-50 text-sm"
                disabled={loading}
              >
                Create Test Post
              </button>
            )}
          </div>
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
                  <p className="text-sm text-gray-400 mt-2">Try adjusting your filters or click the Refresh button</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {posts.map((post) => (
                    <div
                      key={post.id}
                      className={`p-4 hover:bg-gray-50 cursor-pointer ${
                        selectedPost?.id === post.id ? "bg-indigo-50" : ""
                      }`}
                      onClick={() => {
                        console.log('Selected post:', post);
                        setSelectedPost(post);
                      }}
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
                          {post.is_approved === false && (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Pending Approval
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
                      {(selectedPost.is_flagged || selectedPost.report_count > 0 || selectedPost.is_approved === false) ? (
                        <button
                          onClick={() => handleApprovePost(selectedPost.id)}
                          disabled={actionLoading}
                          className="w-full flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                        >
                          {actionLoading ? (
                            <span className="mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                          ) : null}
                          {selectedPost.is_approved === false ? "Approve Post" : "Clear Flags"}
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

                      {selectedPost.is_removed ? (
                        <button
                          onClick={() => handleRestorePost(selectedPost.id)}
                          disabled={actionLoading}
                          className="w-full flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                        >
                          {actionLoading ? (
                            <span className="mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                          ) : null}
                          Restore Post
                        </button>
                      ) : (
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
