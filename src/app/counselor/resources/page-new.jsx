"use client";
import React, { useState, useEffect } from "react";
import { useUser } from "@/utils/useUser";
import { supabase } from "@/utils/supabaseClient";
import Link from "next/link";

function MainComponent() {
  const { data: user } = useUser();
  const [posts, setPosts] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [professionalResponse, setProfessionalResponse] = useState("");
  const [userProfile, setUserProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserProfile();
    } else {
      setProfileLoading(false);
    }
  }, [user]);

  // Function to check and fix schema if needed
  const checkAndFixSchema = async () => {
    try {
      console.log('Checking if schema needs to be fixed...');
      
      // Try to fetch posts to see if there's a schema issue
      const { data, error } = await supabase
        .from('discussion_posts')
        .select('*')
        .limit(1);
      
      if (error && (error.message.includes('relationship') || error.message.includes('does not exist'))) {
        console.log('Schema issue detected, fixing schema...');
        setLoading(true);
        
        // Call the fix-schema endpoint
        const response = await fetch('/api/forum/fix-schema', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        const result = await response.json();
        console.log('Schema fix result:', result);
        
        if (result.success) {
          console.log('Schema fixed successfully');
          return true;
        } else {
          console.error('Failed to fix schema:', result.error);
          return false;
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error checking/fixing schema:', error);
      return false;
    }
  };

  const fetchUserProfile = async () => {
    try {
      // Fetch the user's profile from the database
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Error fetching user profile:', profileError);
        setUserProfile(null);
      } else {
        console.log('User profile:', profile);
        setUserProfile(profile);
      }
    } catch (err) {
      console.error('Error in fetchUserProfile:', err);
      setUserProfile(null);
    } finally {
      setProfileLoading(false);
      fetchPosts();
    }
  };

  const fetchPosts = async () => {
    try {
      console.log('Fetching posts...');
      setLoading(true);
      
      // Check and fix schema if needed
      await checkAndFixSchema();
      
      // Use the direct API endpoint
      const { data, error } = await supabase
        .from('discussion_posts')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching posts:', error);
        
        // If there's a schema issue, try to fix it and retry
        if (error.message.includes('relationship') || error.message.includes('does not exist')) {
          const fixed = await checkAndFixSchema();
          if (fixed) {
            // Try fetching posts again
            const { data: retryData, error: retryError } = await supabase
              .from('discussion_posts')
              .select('*')
              .order('created_at', { ascending: false });
              
            if (retryError) {
              throw retryError;
            }
            
            // Use the retry data
            await processPostsData(retryData);
            return;
          }
        }
        
        throw new Error(error.message);
      }
      
      // Process the posts data
      await processPostsData(data);
    } catch (err) {
      console.error('Error fetching posts:', err);
      setError("Failed to load posts: " + err.message);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };
  
  // Helper function to process posts data
  const processPostsData = async (data) => {
    try {
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
          
          // Format posts with author information
          const formattedPosts = data.map(post => ({
            ...post,
            author_name: post.user_id && userMap[post.user_id] ? 
              userMap[post.user_id].display_name : 
              (post.user_id ? 'User ' + post.user_id.substring(0, 6) : 'Unknown User'),
            author_role: post.user_id && userMap[post.user_id] ?
              userMap[post.user_id].role :
              'user'
          }));
          
          setPosts(formattedPosts);
        } else {
          // Format posts with generic user IDs if we can't get profiles
          const simplePosts = data.map(post => ({
            ...post,
            author_name: post.user_id ? 
              'User ' + post.user_id.substring(0, 6) : 
              'Unknown User',
            author_role: 'user'
          }));
          
          setPosts(simplePosts);
        }
      } else {
        // Format posts without author information
        const simplePosts = data.map(post => ({
          ...post,
          author_name: 'Unknown User',
          author_role: 'user'
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

  const fetchPostDetails = async (postId) => {
    try {
      console.log('Fetching post details for ID:', postId);
      setLoading(true);
      
      // Check and fix schema if needed
      await checkAndFixSchema();
      
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
      
      if (commentsError) {
        throw commentsError;
      }
      
      // Get all user IDs from post and comments
      const userIds = [post.user_id];
      if (comments && comments.length > 0) {
        comments.forEach(comment => {
          if (comment.user_id && !userIds.includes(comment.user_id)) {
            userIds.push(comment.user_id);
          }
        });
      }
      
      // Filter out any null or undefined IDs
      const validUserIds = userIds.filter(Boolean);
      
      if (validUserIds.length > 0) {
        // Get user profiles for all users
        const { data: profiles, error: profilesError } = await supabase
          .from('user_profiles')
          .select('id, display_name, role')
          .in('id', validUserIds);
        
        if (!profilesError && profiles) {
          // Create a map of user_id to profile info
          const userMap = {};
          profiles.forEach(profile => {
            userMap[profile.id] = {
              display_name: profile.display_name,
              role: profile.role
            };
          });
          
          // Format post with author information
          const formattedPost = {
            ...post,
            author_name: post.user_id && userMap[post.user_id] ? 
              userMap[post.user_id].display_name : 
              (post.user_id ? 'User ' + post.user_id.substring(0, 6) : 'Unknown User'),
            author_role: post.user_id && userMap[post.user_id] ?
              userMap[post.user_id].role :
              'user',
            comments: (comments || []).map(comment => ({
              ...comment,
              author_name: comment.user_id && userMap[comment.user_id] ? 
                userMap[comment.user_id].display_name : 
                (comment.user_id ? 'User ' + comment.user_id.substring(0, 6) : 'Unknown User'),
              author_role: comment.user_id && userMap[comment.user_id] ?
                userMap[comment.user_id].role :
                'user'
            }))
          };
          
          setSelectedPost(formattedPost);
        } else {
          // Format with generic user IDs if we can't get profiles
          const formattedPost = {
            ...post,
            author_name: post.user_id ? 'User ' + post.user_id.substring(0, 6) : 'Unknown User',
            author_role: 'user',
            comments: (comments || []).map(comment => ({
              ...comment,
              author_name: comment.user_id ? 'User ' + comment.user_id.substring(0, 6) : 'Unknown User',
              author_role: 'user'
            }))
          };
          
          setSelectedPost(formattedPost);
        }
      } else {
        // Format post without author information
        const formattedPost = {
          ...post,
          author_name: 'Unknown User',
          author_role: 'user',
          comments: (comments || []).map(comment => ({
            ...comment,
            author_name: 'Unknown User',
            author_role: 'user'
          }))
        };
        
        setSelectedPost(formattedPost);
      }
    } catch (err) {
      setError("Failed to load post details: " + err.message);
      console.error('Error fetching post details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateComment = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      // Add a prefix to identify this as a counselor response
      const commentContent = `[Professional Response] ${professionalResponse}`;

      console.log('Creating professional response for post:', selectedPost.id);
      
      // Get the current user session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error("You must be signed in to comment");
      }
      
      // Insert the comment
      const { error } = await supabase
        .from('discussion_comments')
        .insert({
          post_id: selectedPost.id,
          content: commentContent,
          user_id: session.user.id
        });
      
      if (error) {
        throw error;
      }
      
      // Refresh post details
      await fetchPostDetails(selectedPost.id);
      setProfessionalResponse("");
      setError(null);
    } catch (err) {
      setError("Failed to create comment: " + err.message);
      console.error('Error creating comment:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToList = () => {
    setSelectedPost(null);
    fetchPosts(); // Refresh the posts list
  };

  if (loading || profileLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#357AFF] border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-xl">
          <h1 className="mb-4 text-2xl font-bold text-gray-800">
            Sign In Required
          </h1>
          <p className="mb-6 text-gray-600">
            Please sign in to access the counselor resources.
          </p>
          <a
            href={`/account/signin?callbackUrl=${encodeURIComponent(
              "/counselor/resources"
            )}`}
            className="inline-block rounded-lg bg-[#357AFF] px-6 py-3 text-white hover:bg-[#2E69DE]"
          >
            Sign In
          </a>
        </div>
      </div>
    );
  }

  // Get the user role from the profile
  const userRole = userProfile?.role || '';
  console.log('User role from profile:', userRole);

  if (userRole !== "counselor" && userRole !== "admin") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-xl">
          <h1 className="mb-4 text-2xl font-bold text-gray-800">
            Access Denied
          </h1>
          <p className="mb-6 text-gray-600">
            This area is restricted to counselors only. Your role: {userRole}
          </p>
          <a
            href="/"
            className="inline-block rounded-lg bg-[#357AFF] px-6 py-3 text-white hover:bg-[#2E69DE]"
          >
            Return Home
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
      <div className="mx-auto max-w-4xl">
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
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-xl md:p-8">
          {selectedPost ? (
            <div>
              <button
                onClick={handleBackToList}
                className="mb-6 inline-flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-gray-600 hover:bg-gray-200"
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
                Back to Posts
              </button>

              <h1 className="mb-2 text-2xl font-bold text-gray-800">
                {selectedPost.title}
              </h1>
              <div className="mb-4 text-sm text-gray-600">
                Posted by {selectedPost.author_name || "Anonymous"} on{" "}
                {new Date(selectedPost.created_at).toLocaleDateString()}
              </div>
              <div className="mb-8 rounded-lg bg-gray-50 p-4 text-gray-700">
                {selectedPost.content}
              </div>

              <div className="border-t pt-6">
                <h3 className="mb-4 text-xl font-bold text-gray-800">Comments</h3>

                <form onSubmit={handleCreateComment} className="mb-6">
                  <div className="mb-2 rounded-lg bg-blue-50 p-4">
                    <h4 className="mb-2 font-semibold text-blue-700">Professional Response</h4>
                    <p className="mb-4 text-sm text-blue-600">
                      As a mental health professional, your response will be highlighted and marked as a professional response.
                    </p>
                    <textarea
                      value={professionalResponse}
                      onChange={(e) => setProfessionalResponse(e.target.value)}
                      placeholder="Provide your professional guidance here..."
                      className="mb-2 h-24 w-full rounded-lg border border-blue-200 p-3 focus:border-[#357AFF] focus:outline-none focus:ring-1 focus:ring-[#357AFF]"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="rounded-lg bg-[#357AFF] px-4 py-2 text-white hover:bg-[#2E69DE]"
                  >
                    Submit Professional Response
                  </button>
                </form>

                <div className="space-y-4">
                  {selectedPost.comments?.map((comment) => (
                    <div
                      key={comment.id}
                      className={`rounded-lg p-4 ${
                        comment.content.startsWith('[Professional Response]')
                          ? 'bg-blue-50 border border-blue-100'
                          : 'bg-gray-50'
                      }`}
                    >
                      <div className="mb-2 text-sm text-gray-600">
                        {comment.author_name || "Anonymous"}
                        {comment.author_role === 'counselor' && (
                          <span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
                            Counselor
                          </span>
                        )}
                        {comment.author_role === 'admin' && (
                          <span className="ml-2 rounded-full bg-purple-100 px-2 py-0.5 text-xs text-purple-700">
                            Admin
                          </span>
                        )}
                        {" - "}
                        {new Date(comment.created_at).toLocaleDateString()}
                      </div>
                      <p className={`${
                        comment.content.startsWith('[Professional Response]')
                          ? 'text-blue-700 font-medium'
                          : 'text-gray-700'
                      }`}>
                        {comment.content.startsWith('[Professional Response]')
                          ? comment.content.replace('[Professional Response]', '').trim()
                          : comment.content
                        }
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-6 flex items-center justify-between">
                <h1 className="text-3xl font-bold text-gray-800">Community Support</h1>
              </div>

              {error && (
                <div className="mb-4 rounded-lg bg-red-50 p-4 text-red-500">
                  {error}
                </div>
              )}

              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#357AFF] border-t-transparent"></div>
                </div>
              ) : posts.length === 0 ? (
                <div className="rounded-lg bg-gray-50 p-8 text-center">
                  <p className="text-gray-600">No community posts found.</p>
                  {error ? (
                    <p className="mt-2 text-sm text-gray-500">
                      {error}
                    </p>
                  ) : (
                    <p className="mt-2 text-sm text-gray-500">
                      Community members haven't posted anything yet.
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {posts.map((post) => (
                    <div
                      key={post.id}
                      className="cursor-pointer rounded-2xl bg-white p-6 shadow-xl transition-shadow hover:shadow-2xl"
                      onClick={() => fetchPostDetails(post.id)}
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
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CounselorResourcesPage() {
  return <MainComponent />;
}
