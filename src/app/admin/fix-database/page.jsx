"use client";
import React, { useState } from "react";
import { useUser } from "@/utils/useUser";
import { supabase } from "@/utils/supabaseClient";
import Link from "next/link";
import { initForumTables as initForumTablesUtil } from "./init-forum-tables";

export default function FixDatabasePage() {
  const { data: user, loading: userLoading } = useUser();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [tableInfo, setTableInfo] = useState(null);
  const [forumTablesInfo, setForumTablesInfo] = useState(null);

  const checkTableStructure = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      setTableInfo(null);

      // Check if the counseling_sessions table exists
      const { data: tableExists, error: tableExistsError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .eq('table_name', 'counseling_sessions')
        .single();

      if (tableExistsError && tableExistsError.code !== 'PGRST116') {
        throw new Error(`Error checking if table exists: ${tableExistsError.message}`);
      }

      if (!tableExists) {
        setTableInfo({ exists: false });
        setSuccess("Counseling sessions table does not exist. You can create it.");
        return;
      }

      // Check the table structure
      const { data: columns, error: columnsError } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable')
        .eq('table_schema', 'public')
        .eq('table_name', 'counseling_sessions')
        .order('ordinal_position');

      if (columnsError) {
        throw new Error(`Error checking table structure: ${columnsError.message}`);
      }

      setTableInfo({ exists: true, columns });
      setSuccess("Table structure checked successfully.");
    } catch (err) {
      console.error("Error checking table structure:", err);
      setError(err.message || "Failed to check table structure");
    } finally {
      setLoading(false);
    }
  };

  const fixTableStructure = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      // Drop the existing table
      const { error: dropError } = await supabase.rpc('exec_sql', {
        sql: `DROP TABLE IF EXISTS public.counseling_sessions;`
      });

      if (dropError) {
        throw new Error(`Error dropping table: ${dropError.message}`);
      }

      // Create a new table with the correct structure
      const { error: createError } = await supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE public.counseling_sessions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            counselor_id UUID NOT NULL,
            patient_id UUID NOT NULL,
            session_date TIMESTAMP WITH TIME ZONE NOT NULL,
            duration INTEGER DEFAULT 60,
            status TEXT DEFAULT 'scheduled',
            notes TEXT,
            video_enabled BOOLEAN DEFAULT false,
            video_room_id TEXT,
            video_join_url TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );

          -- Add indexes for better performance
          CREATE INDEX IF NOT EXISTS counseling_sessions_counselor_id_idx ON public.counseling_sessions(counselor_id);
          CREATE INDEX IF NOT EXISTS counseling_sessions_patient_id_idx ON public.counseling_sessions(patient_id);
        `
      });

      if (createError) {
        throw new Error(`Error creating table: ${createError.message}`);
      }

      // Check the new table structure
      await checkTableStructure();
      setSuccess("Table structure fixed successfully.");
    } catch (err) {
      console.error("Error fixing table structure:", err);
      setError(err.message || "Failed to fix table structure");
    } finally {
      setLoading(false);
    }
  };

  const createTestSession = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      // Get the current user's ID
      const userId = user.id;

      // Create a test session
      const { data: sessionData, error: sessionError } = await supabase
        .from('counseling_sessions')
        .insert({
          counselor_id: userId,
          patient_id: userId, // Using the same ID for testing
          session_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
          duration: 60,
          status: 'scheduled',
          notes: 'Test session',
          video_enabled: true,
          video_room_id: 'test-room',
          video_join_url: 'https://example.com/video/test-room'
        })
        .select();

      if (sessionError) {
        throw new Error(`Error creating test session: ${sessionError.message}`);
      }

      setSuccess(`Test session created successfully with ID: ${sessionData[0].id}`);
    } catch (err) {
      console.error("Error creating test session:", err);
      setError(err.message || "Failed to create test session");
    } finally {
      setLoading(false);
    }
  };

  const checkForumTables = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      setForumTablesInfo(null);

      // Check if the discussion_posts table exists
      const { data: postsTableExists, error: postsTableError } = await supabase.rpc('exec_sql', {
        sql: `SELECT EXISTS (
          SELECT FROM pg_tables
          WHERE schemaname = 'public'
          AND tablename = 'discussion_posts'
        );`
      });

      if (postsTableError) {
        throw new Error(`Error checking if discussion_posts table exists: ${postsTableError.message}`);
      }

      // Check if the discussion_comments table exists
      const { data: commentsTableExists, error: commentsTableError } = await supabase.rpc('exec_sql', {
        sql: `SELECT EXISTS (
          SELECT FROM pg_tables
          WHERE schemaname = 'public'
          AND tablename = 'discussion_comments'
        );`
      });

      if (commentsTableError) {
        throw new Error(`Error checking if discussion_comments table exists: ${commentsTableError.message}`);
      }

      let postsColumns = [];
      let commentsColumns = [];

      // If posts table exists, get its columns
      const postsExists = postsTableExists && postsTableExists.data && postsTableExists.data[0] && postsTableExists.data[0].exists;
      if (postsExists) {
        const { data: columns, error: columnsError } = await supabase
          .from('information_schema.columns')
          .select('column_name, data_type, is_nullable')
          .eq('table_schema', 'public')
          .eq('table_name', 'discussion_posts')
          .order('ordinal_position');

        if (columnsError) {
          throw new Error(`Error checking discussion_posts table structure: ${columnsError.message}`);
        }

        postsColumns = columns;
      }

      // If comments table exists, get its columns
      const commentsExists = commentsTableExists && commentsTableExists.data && commentsTableExists.data[0] && commentsTableExists.data[0].exists;
      if (commentsExists) {
        const { data: columns, error: columnsError } = await supabase
          .from('information_schema.columns')
          .select('column_name, data_type, is_nullable')
          .eq('table_schema', 'public')
          .eq('table_name', 'discussion_comments')
          .order('ordinal_position');

        if (columnsError) {
          throw new Error(`Error checking discussion_comments table structure: ${columnsError.message}`);
        }

        commentsColumns = columns;
      }

      setForumTablesInfo({
        postsExists,
        commentsExists,
        postsColumns,
        commentsColumns
      });

      setSuccess("Forum tables checked successfully.");
    } catch (err) {
      console.error("Error checking forum tables:", err);
      setError(err.message || "Failed to check forum tables");
    } finally {
      setLoading(false);
    }
  };

  const createTestPost = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      // Get the current user's ID
      const userId = user.id;

      // Create a test post
      const { data: postData, error: postError } = await supabase
        .from('discussion_posts')
        .insert({
          user_id: userId,
          title: 'Test Post',
          content: 'This is a test post created from the admin panel.'
        })
        .select();

      if (postError) {
        throw new Error(`Error creating test post: ${postError.message}`);
      }

      // Create a test comment
      const { error: commentError } = await supabase
        .from('discussion_comments')
        .insert({
          post_id: postData[0].id,
          user_id: userId,
          content: 'This is a test comment created from the admin panel.'
        })
        .select();

      if (commentError) {
        throw new Error(`Error creating test comment: ${commentError.message}`);
      }

      setSuccess(`Test post and comment created successfully with post ID: ${postData[0].id}`);
      await checkForumTables();
    } catch (err) {
      console.error("Error creating test post:", err);
      setError(err.message || "Failed to create test post");
    } finally {
      setLoading(false);
    }
  };

  const dropForumTables = async () => {
    try {
      if (!window.confirm(
        "Are you sure you want to drop the forum tables? This will delete all posts and comments."
      )) {
        return;
      }

      setLoading(true);
      setError(null);
      setSuccess(null);

      // Drop the existing tables
      const { error: dropPostsError } = await supabase.rpc('exec_sql', {
        sql: `DROP TABLE IF EXISTS public.discussion_comments; DROP TABLE IF EXISTS public.discussion_posts;`
      });

      if (dropPostsError) {
        throw new Error(`Error dropping forum tables: ${dropPostsError.message}`);
      }

      setSuccess("Forum tables dropped successfully.");
      setForumTablesInfo(null);
    } catch (err) {
      console.error("Error dropping forum tables:", err);
      setError(err.message || "Failed to drop forum tables");
    } finally {
      setLoading(false);
    }
  };

  const initializeForumTables = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      // Call the imported function to initialize forum tables
      await initForumTablesUtil();

      // After initializing, check the tables again
      await checkForumTables();

      setSuccess("Forum tables initialized successfully!");
    } catch (err) {
      console.error("Error initializing forum tables:", err);
      setError(err.message || "Failed to initialize forum tables");
    } finally {
      setLoading(false);
    }
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
      <div className="max-w-4xl mx-auto">
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

        <div className="bg-white rounded-xl shadow-xl p-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">Fix Database Structure</h1>

          {error && (
            <div className="mb-6 bg-red-50 p-4 rounded-lg text-red-600">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 bg-green-50 p-4 rounded-lg text-green-600">
              {success}
            </div>
          )}

          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Counseling Sessions Table</h2>
              <p className="text-gray-600 mb-4">
                Check and fix the structure of the counseling_sessions table.
              </p>

              <div className="flex space-x-4 mb-4">
                <button
                  onClick={checkTableStructure}
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                  disabled={loading}
                >
                  {loading ? "Checking..." : "Check Structure"}
                </button>

                <button
                  onClick={fixTableStructure}
                  className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                  disabled={loading}
                >
                  {loading ? "Fixing..." : "Fix Structure"}
                </button>

                <button
                  onClick={createTestSession}
                  className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                  disabled={loading || !tableInfo?.exists}
                >
                  {loading ? "Creating..." : "Create Test Session"}
                </button>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Forum Tables</h2>
              <p className="text-gray-600 mb-4">
                Initialize or fix the forum tables (discussion_posts and discussion_comments).
              </p>

              <div className="flex space-x-4 mb-4">
                <button
                  onClick={checkForumTables}
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                  disabled={loading}
                >
                  {loading ? "Checking..." : "Check Forum Tables"}
                </button>

                <button
                  onClick={initializeForumTables}
                  className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                  disabled={loading}
                >
                  {loading ? "Initializing..." : "Initialize Forum Tables"}
                </button>

                <button
                  onClick={createTestPost}
                  className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                  disabled={loading || !forumTablesInfo?.postsExists}
                >
                  {loading ? "Creating..." : "Create Test Post"}
                </button>

                <button
                  onClick={dropForumTables}
                  className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                  disabled={loading}
                >
                  {loading ? "Dropping..." : "Drop Forum Tables"}
                </button>
              </div>

              {forumTablesInfo && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-800 mb-2">Forum Tables Information</h3>

                  <div className="mb-4">
                    <h4 className="font-medium text-gray-700">Discussion Posts Table</h4>
                    {!forumTablesInfo.postsExists ? (
                      <p className="text-red-600">Table does not exist.</p>
                    ) : (
                      <div>
                        <p className="text-green-600 mb-2">Table exists with {forumTablesInfo.postsColumns.length} columns:</p>
                        <div className="overflow-x-auto">
                          <table className="min-w-full bg-white">
                            <thead>
                              <tr>
                                <th className="py-2 px-4 border-b border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                  Column Name
                                </th>
                                <th className="py-2 px-4 border-b border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                  Data Type
                                </th>
                                <th className="py-2 px-4 border-b border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                  Nullable
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {forumTablesInfo.postsColumns.map((column, index) => (
                                <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                                  <td className="py-2 px-4 border-b border-gray-200 text-sm">
                                    {column.column_name}
                                  </td>
                                  <td className="py-2 px-4 border-b border-gray-200 text-sm">
                                    {column.data_type}
                                  </td>
                                  <td className="py-2 px-4 border-b border-gray-200 text-sm">
                                    {column.is_nullable === "YES" ? "Yes" : "No"}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-700">Discussion Comments Table</h4>
                    {!forumTablesInfo.commentsExists ? (
                      <p className="text-red-600">Table does not exist.</p>
                    ) : (
                      <div>
                        <p className="text-green-600 mb-2">Table exists with {forumTablesInfo.commentsColumns.length} columns:</p>
                        <div className="overflow-x-auto">
                          <table className="min-w-full bg-white">
                            <thead>
                              <tr>
                                <th className="py-2 px-4 border-b border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                  Column Name
                                </th>
                                <th className="py-2 px-4 border-b border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                  Data Type
                                </th>
                                <th className="py-2 px-4 border-b border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                  Nullable
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {forumTablesInfo.commentsColumns.map((column, index) => (
                                <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                                  <td className="py-2 px-4 border-b border-gray-200 text-sm">
                                    {column.column_name}
                                  </td>
                                  <td className="py-2 px-4 border-b border-gray-200 text-sm">
                                    {column.data_type}
                                  </td>
                                  <td className="py-2 px-4 border-b border-gray-200 text-sm">
                                    {column.is_nullable === "YES" ? "Yes" : "No"}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {tableInfo && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-800 mb-2">Table Information</h3>

                  {!tableInfo.exists ? (
                    <p className="text-red-600">Table does not exist.</p>
                  ) : (
                    <div>
                      <p className="text-green-600 mb-2">Table exists with {tableInfo.columns.length} columns:</p>
                      <div className="overflow-x-auto">
                        <table className="min-w-full bg-white">
                          <thead>
                            <tr>
                              <th className="py-2 px-4 border-b border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Column Name
                              </th>
                              <th className="py-2 px-4 border-b border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Data Type
                              </th>
                              <th className="py-2 px-4 border-b border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Nullable
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {tableInfo.columns.map((column, index) => (
                              <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                                <td className="py-2 px-4 border-b border-gray-200 text-sm">
                                  {column.column_name}
                                </td>
                                <td className="py-2 px-4 border-b border-gray-200 text-sm">
                                  {column.data_type}
                                </td>
                                <td className="py-2 px-4 border-b border-gray-200 text-sm">
                                  {column.is_nullable === "YES" ? "Yes" : "No"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
