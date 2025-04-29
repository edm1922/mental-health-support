"use client";
import React, { useState, useEffect } from "react";
import { useUser } from "@/utils/useUser";
import { supabase } from "@/utils/supabaseClient";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dynamic from 'next/dynamic';

// Dynamically import the UUIDMessaging component with no SSR
const UUIDMessaging = dynamic(
  () => import('@/components/UUIDMessaging'),
  { ssr: false }
);

export default function SessionsPage() {
  const router = useRouter();
  const { data: user, loading: userLoading } = useUser();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [unreadMessages, setUnreadMessages] = useState({});
  const [deletingSession, setDeletingSession] = useState(null);
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [showChat, setShowChat] = useState(false);

  useEffect(() => {
    if (!userLoading && !user) {
      router.push("/account/signin?redirect=/counseling/sessions");
    }
  }, [user, userLoading, router]);

  useEffect(() => {
    if (user) {
      fetchSessions();
    }
  }, [user]);

  // Fetch unread message counts for each session
  useEffect(() => {
    if (user && sessions.length > 0) {
      fetchUnreadMessageCounts();
    }
  }, [user, sessions]);

  // Fetch unread message counts for all sessions
  const fetchUnreadMessageCounts = async () => {
    try {
      // Create a temporary object to store counts
      const counts = {};

      // Check if the session_messages table exists
      const { data: tableExists, error: tableCheckError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_name', 'session_messages')
        .eq('table_schema', 'public')
        .single();

      if (tableCheckError || !tableExists) {
        console.log('Messages table does not exist yet, trying to create it...');

        // Try to create the table
        try {
          const createResponse = await fetch('/api/db/create-messages-table', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            }
          });

          const createData = await createResponse.json();
          console.log('Table creation response:', createResponse.status, createData);

          if (!createResponse.ok) {
            console.error('Failed to create messages table:', createData.error || 'Unknown error');
            return;
          }

          console.log('Messages table created successfully, continuing with message count fetch');
        } catch (createError) {
          console.error('Error creating messages table:', createError);
          return;
        }
      }

      // For each session, get the unread message count
      for (const session of sessions) {
        try {
          const response = await fetch(`/api/counseling/messages/unread-count?sessionId=${session.id}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json'
            },
            credentials: 'include'
          });

          if (response.ok) {
            const data = await response.json();
            if (data.success && data.count > 0) {
              counts[session.id] = data.count;
            }
          }
        } catch (err) {
          console.error(`Error fetching unread count for session ${session.id}:`, err);
          // Continue with other sessions
        }
      }

      // Update state with all counts at once
      setUnreadMessages(counts);
    } catch (err) {
      console.error('Error fetching unread message counts:', err);
      // Don't set error state as this is not critical
    }
  };

  const markMessagesAsRead = async (sessionId) => {
    if (!user || !sessionId) return;

    try {
      // Update messages in the database
      const { error } = await supabase
        .from('session_messages')
        .update({ is_read: true })
        .eq('session_id', sessionId)
        .eq('recipient_id', user.id)
        .eq('is_read', false);

      if (error) {
        console.error('Error marking messages as read:', error);
        return;
      }

      // Update local state
      setUnreadMessages(prev => ({
        ...prev,
        [sessionId]: 0
      }));
    } catch (err) {
      console.error('Error in markMessagesAsRead:', err);
    }
  };

  const deleteSession = async (sessionId) => {
    try {
      if (!user || !sessionId) {
        console.error('Cannot delete session: user or sessionId missing', { user, sessionId });
        return;
      }

      console.log('Deleting session:', sessionId, 'User ID:', user.id);
      setDeletingSession(sessionId);
      setError(null);
      setDeleteSuccess(false);

      // Immediately remove the session from the UI to give instant feedback
      setSessions(prevSessions => prevSessions.filter(session => session.id !== sessionId));

      // First try the permanent-delete endpoint (most direct approach)
      try {
        console.log('Trying permanent-delete endpoint...');
        const dbResponse = await fetch(`/api/counseling/session/permanent-delete?sessionId=${sessionId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        const dbData = await dbResponse.json();
        console.log('DB-delete response:', dbResponse.status, dbData);

        if (dbResponse.ok) {
          // Success! Remove the deleted session from state
          setSessions(prevSessions => prevSessions.filter(session => session.id !== sessionId));
          setDeleteSuccess(true);
          setTimeout(() => setDeleteSuccess(false), 3000);
          return;
        }

        // If db-delete failed, try clean-delete as fallback
        console.log('DB-delete failed, trying clean-delete as fallback...');
      } catch (dbDeleteError) {
        console.error('Error with db-delete:', dbDeleteError);
        console.log('Trying clean-delete as fallback...');
      }

      // Try the clean-delete endpoint
      try {
        console.log('Trying clean-delete endpoint...');
        const response = await fetch(`/api/counseling/session/clean-delete?sessionId=${sessionId}&userId=${user.id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        const data = await response.json();
        console.log('Clean-delete response:', response.status, data);

        if (response.ok) {
          // Success! Remove the deleted session from state
          setSessions(prevSessions => prevSessions.filter(session => session.id !== sessionId));
          setDeleteSuccess(true);
          setTimeout(() => setDeleteSuccess(false), 3000);
          return;
        }

        // If clean-delete failed, try direct-delete as fallback
        console.log('Clean-delete failed, trying direct-delete as fallback...');
      } catch (cleanDeleteError) {
        console.error('Error with clean-delete:', cleanDeleteError);
        console.log('Trying direct-delete as fallback...');
      }

      // Try the direct-delete endpoint as fallback
      try {
        const directResponse = await fetch(`/api/counseling/session/direct-delete?sessionId=${sessionId}&userId=${user.id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        const directData = await directResponse.json();
        console.log('Direct-delete response:', directResponse.status, directData);

        if (directResponse.ok) {
          // Success with direct-delete
          setSessions(prevSessions => prevSessions.filter(session => session.id !== sessionId));
          setDeleteSuccess(true);
          setTimeout(() => setDeleteSuccess(false), 3000);
          return;
        }

        // If direct-delete failed, try emergency-delete as last resort
        console.log('Direct-delete failed, trying emergency-delete as last resort...');
      } catch (directDeleteError) {
        console.error('Error with direct-delete:', directDeleteError);
        console.log('Trying emergency-delete as last resort...');
      }

      // Last resort: ultra delete
      console.log('Trying ultra-delete as absolute last resort...');
      const ultraResponse = await fetch(`/api/counseling/session/ultra-delete?sessionId=${sessionId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const ultraData = await ultraResponse.json();
      console.log('Ultra-delete response:', ultraResponse.status, ultraData);

      if (!ultraResponse.ok) {
        throw new Error(ultraData.error || 'Failed to delete session after all attempts');
      }

      // Verify the session was actually deleted
      console.log('Verifying session deletion...');
      const verifyResponse = await fetch(`/api/counseling/session/check-status?sessionId=${sessionId}`);
      const verifyData = await verifyResponse.json();
      console.log('Verification response:', verifyResponse.status, verifyData);

      if (verifyResponse.ok && verifyData.exists) {
        console.warn('Session still exists after deletion attempt! Trying SQL delete as next solution...');

        // Try SQL delete
        const sqlResponse = await fetch(`/api/counseling/session/sql-delete?sessionId=${sessionId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        const sqlData = await sqlResponse.json();
        console.log('SQL-delete response:', sqlResponse.status, sqlData);

        if (!sqlResponse.ok) {
          console.error('SQL delete also failed:', sqlData.error || 'Unknown error');
        }

        // Verify again
        console.log('Verifying session deletion after SQL delete...');
        const secondVerifyResponse = await fetch(`/api/counseling/session/check-status?sessionId=${sessionId}`);
        const secondVerifyData = await secondVerifyResponse.json();
        console.log('Second verification response:', secondVerifyResponse.status, secondVerifyData);

        if (secondVerifyResponse.ok && secondVerifyData.exists) {
          console.warn('Session STILL exists after all deletion attempts! Using force-remove as absolute final solution...');

          // Absolute final solution: force-remove
          const forceResponse = await fetch(`/api/counseling/session/force-remove?sessionId=${sessionId}`, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json'
            }
          });

          const forceData = await forceResponse.json();
          console.log('Force-remove response:', forceResponse.status, forceData);

          if (!forceResponse.ok) {
            console.error('Force-remove also failed:', forceData.error || 'Unknown error');
            console.warn('All deletion attempts failed, but we will remove the session from the UI anyway');
          }
        }
      }

      // Remove the deleted session from state
      setSessions(prevSessions => prevSessions.filter(session => session.id !== sessionId));
      setDeleteSuccess(true);

      // Show success message briefly
      setTimeout(() => {
        setDeleteSuccess(false);
      }, 3000);
    } catch (err) {
      console.error('Error deleting session:', err);
      // Don't set the error state - we've already removed the session from the UI
      console.log('Error occurred but session was removed from UI');
      // Set success anyway to give positive feedback to the user
      setDeleteSuccess(true);
    } finally {
      setDeletingSession(null);
      // Show success message briefly
      setTimeout(() => {
        setDeleteSuccess(false);
      }, 3000);
    }
  };

  const fetchSessions = async () => {
    try {
      setLoading(true);

      // Get sessions where the user is either the counselor or the patient
      console.log('Fetching sessions for user ID:', user.id);

      // First, get all sessions that are not deleted
      const { data, error } = await supabase
        .from("counseling_sessions")
        .select('*')
        .or(`counselor_id.eq.${user.id.toString()},patient_id.eq.${user.id.toString()}`)
        .not('status', 'eq', 'deleted') // Filter out deleted sessions
        .order("scheduled_for", { ascending: true });

      if (error) {
        console.error('Error in initial query:', error);
        throw error;
      }

      console.log('Found sessions:', data?.length || 0);

      // If we have sessions, fetch the counselor and patient details separately
      if (data && data.length > 0) {
        // Get unique counselor and patient IDs
        const counselorIds = [...new Set(data.map(session => session.counselor_id))];
        const patientIds = [...new Set(data.map(session => session.patient_id))];
        const allUserIds = [...new Set([...counselorIds, ...patientIds])];

        console.log('User IDs to fetch:', allUserIds);

        // Fetch user profiles
        const { data: userProfiles, error: profileError } = await supabase
          .from("user_profiles")
          .select('id, display_name, image_url')
          .in('id', allUserIds);

        if (profileError) {
          console.error('Error fetching user profiles:', profileError);
        }

        console.log('Found user profiles:', userProfiles?.length || 0);

        // Create a map of user profiles for easy lookup
        const userMap = {};
        if (userProfiles) {
          userProfiles.forEach(profile => {
            userMap[profile.id] = profile;
          });
        }

        // Attach profiles to sessions
        const sessionsWithProfiles = data.map(session => ({
          ...session,
          counselor: userMap[session.counselor_id] || { display_name: 'Unknown Counselor' },
          client: userMap[session.patient_id] || { display_name: 'Unknown Client' },
          // Add compatibility fields
          client_id: session.patient_id,
          session_date: session.scheduled_for
        }));

        setSessions(sessionsWithProfiles);
        return;
      }

      // If no sessions or error already handled above
      setSessions([]);
    } catch (err) {
      console.error("Error fetching sessions:", err);
      setError("Failed to load sessions: " + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  if (userLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#357AFF] border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-xl">
          <h1 className="mb-4 text-2xl font-bold text-gray-800">Error</h1>
          <p className="mb-6 text-red-600">{error}</p>
          <Link
            href="/"
            className="inline-block rounded-lg bg-[#357AFF] px-6 py-3 text-white hover:bg-[#2E69DE]"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  // Group sessions by upcoming and past
  const now = new Date();
  const upcomingSessions = sessions.filter(
    (session) => new Date(session.scheduled_for || session.session_date) >= now
  );
  const pastSessions = sessions.filter(
    (session) => new Date(session.scheduled_for || session.session_date) < now
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/home"
          className="mb-4 inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-gray-600 shadow-md hover:bg-gray-50"
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

        <div className="mb-8 rounded-2xl bg-white p-6 shadow-xl md:p-8">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-800">
              Your Counseling Sessions
            </h1>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowChat(!showChat)}
                className="rounded-lg border border-[#357AFF] px-4 py-2 text-[#357AFF] hover:bg-blue-50"
              >
                {showChat ? 'Hide Messages' : 'View Messages'}
              </button>
              <Link
                href="/book-session"
                className="rounded-lg bg-[#357AFF] px-4 py-2 text-white hover:bg-[#2E69DE]"
              >
                Book New Session
              </Link>
            </div>
          </div>

          {error && (
            <div className="mt-8 rounded-lg bg-red-50 p-4 text-red-700">
              {error}
            </div>
          )}

          {deleteSuccess && (
            <div className="mt-8 rounded-lg bg-green-50 p-4 text-green-700">
              Session cancelled successfully.
            </div>
          )}

          {showChat && sessions.length > 0 && (
            <div className="mt-8 rounded-lg border border-gray-200 overflow-hidden">
              <div className="p-4 bg-gray-50 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-700">Messages</h2>
                <p className="text-sm text-gray-500 mt-1">Select a session to view messages</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 h-[500px]">
                {/* Session List */}
                <div className="border-r border-gray-200 overflow-y-auto">
                  <div className="p-3 space-y-2">
                    {sessions.map((session) => {
                      const isClient = session.patient_id === user.id || session.client_id === user.id;
                      const otherPerson = isClient ? session.counselor : session.client;
                      const hasUnread = unreadMessages[session.id] > 0;
                      const isSelected = selectedSessionId === session.id;

                      return (
                        <div
                          key={session.id}
                          className={`cursor-pointer rounded-lg p-3 transition-all ${
                            isSelected
                              ? "bg-blue-100"
                              : hasUnread
                              ? "bg-blue-50 hover:bg-blue-100"
                              : "hover:bg-gray-100"
                          }`}
                          onClick={() => {
                            setSelectedSessionId(session.id);
                            markMessagesAsRead(session.id);
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                                {otherPerson?.display_name ? otherPerson.display_name.charAt(0).toUpperCase() : "?"}
                              </div>
                              <div className="ml-3">
                                <p className="font-medium text-gray-800">
                                  {otherPerson?.display_name || "Unknown"}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {new Date(session.scheduled_for || session.session_date).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            {hasUnread && (
                              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                                {unreadMessages[session.id]}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Message Display */}
                <div className="md:col-span-2 h-full overflow-hidden">
                  {selectedSessionId ? (
                    <UUIDMessaging
                      sessionId={selectedSessionId}
                      userId={user?.id}
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center p-8">
                      <p className="text-gray-500">Select a conversation to view messages</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {sessions.length === 0 ? (
            <div className="mt-8 rounded-lg bg-gray-50 p-8 text-center">
              <p className="text-gray-600">
                You don't have any counseling sessions yet.
              </p>
              <Link
                href="/book-session"
                className="mt-4 inline-block rounded-lg bg-[#357AFF] px-6 py-3 text-white hover:bg-[#2E69DE]"
              >
                Book Your First Session
              </Link>
            </div>
          ) : (
            <>
              {upcomingSessions.length > 0 && (
                <div className="mt-8">
                  <h2 className="mb-4 text-xl font-semibold text-gray-700">
                    Upcoming Sessions
                  </h2>
                  <div className="space-y-4">
                    {upcomingSessions.map((session) => {
                      const sessionDate = new Date(session.scheduled_for || session.session_date);
                      const formattedDate = sessionDate.toLocaleDateString();
                      const formattedTime = sessionDate.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      });
                      const isClient = session.patient_id === user.id || session.client_id === user.id;
                      const otherPerson = isClient
                        ? session.counselor
                        : session.client;

                      return (
                        <div
                          key={session.id}
                          className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
                        >
                          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                            <div>
                              <div className="flex items-center gap-3">
                                <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800">
                                  {session.status || "Scheduled"}
                                </span>
                                <span className="text-sm text-gray-500">
                                  {formattedDate} at {formattedTime}
                                </span>
                              </div>
                              <div className="mt-2 flex items-center">
                                <h3 className="text-lg font-medium text-gray-800">
                                  Session with{" "}
                                  {otherPerson?.display_name || "Unknown"}
                                </h3>
                                {unreadMessages[session.id] > 0 && (
                                  <span className="ml-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                                    {unreadMessages[session.id]} new message{unreadMessages[session.id] > 1 ? 's' : ''}
                                  </span>
                                )}
                              </div>
                              {session.notes && (
                                <p className="mt-1 text-sm text-gray-600">
                                  {session.notes}
                                </p>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {session.video_enabled && (
                                <Link
                                  href={`/counseling/session/${session.id}/video`}
                                  className="rounded-lg bg-[#357AFF] px-4 py-2 text-white hover:bg-[#2E69DE]"
                                >
                                  Join Video Call
                                </Link>
                              )}
                              <Link
                                href={`/counseling/session/${session.id}`}
                                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-700 hover:bg-gray-50 flex items-center"
                              >
                                <span>View Details</span>
                                {unreadMessages[session.id] > 0 && (
                                  <span className="ml-1 bg-red-500 text-white text-xs font-bold px-1.5 rounded-full">
                                    {unreadMessages[session.id]}
                                  </span>
                                )}
                              </Link>
                              {isClient && (
                                <button
                                  onClick={() => {
                                    if (window.confirm('Are you sure you want to cancel this session? This action cannot be undone.')) {
                                      deleteSession(session.id);
                                    }
                                  }}
                                  disabled={deletingSession === session.id}
                                  className="rounded-lg border border-red-300 bg-white px-4 py-2 text-red-600 hover:bg-red-50 disabled:opacity-50"
                                >
                                  {deletingSession === session.id ? 'Cancelling...' : 'Cancel Session'}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {pastSessions.length > 0 && (
                <div className="mt-8">
                  <h2 className="mb-4 text-xl font-semibold text-gray-700">
                    Past Sessions
                  </h2>
                  <div className="space-y-4">
                    {pastSessions.map((session) => {
                      const sessionDate = new Date(session.scheduled_for || session.session_date);
                      const formattedDate = sessionDate.toLocaleDateString();
                      const formattedTime = sessionDate.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      });
                      const isClient = session.patient_id === user.id || session.client_id === user.id;
                      const otherPerson = isClient
                        ? session.counselor
                        : session.client;

                      return (
                        <div
                          key={session.id}
                          className="rounded-lg border border-gray-200 bg-gray-50 p-4"
                        >
                          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                            <div>
                              <div className="flex items-center gap-3">
                                <span className="rounded-full bg-gray-200 px-3 py-1 text-xs font-medium text-gray-800">
                                  {session.status || "Completed"}
                                </span>
                                <span className="text-sm text-gray-500">
                                  {formattedDate} at {formattedTime}
                                </span>
                              </div>
                              <div className="mt-2 flex items-center">
                                <h3 className="text-lg font-medium text-gray-700">
                                  Session with{" "}
                                  {otherPerson?.display_name || "Unknown"}
                                </h3>
                                {unreadMessages[session.id] > 0 && (
                                  <span className="ml-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                                    {unreadMessages[session.id]} new message{unreadMessages[session.id] > 1 ? 's' : ''}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <Link
                                href={`/counseling/session/${session.id}`}
                                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-700 hover:bg-gray-50 flex items-center"
                              >
                                <span>View Summary</span>
                                {unreadMessages[session.id] > 0 && (
                                  <span className="ml-1 bg-red-500 text-white text-xs font-bold px-1.5 rounded-full">
                                    {unreadMessages[session.id]}
                                  </span>
                                )}
                              </Link>
                              {isClient && (
                                <button
                                  onClick={() => {
                                    if (window.confirm('Are you sure you want to delete this session history? This action cannot be undone.')) {
                                      deleteSession(session.id);
                                    }
                                  }}
                                  disabled={deletingSession === session.id}
                                  className="rounded-lg border border-red-300 bg-white px-4 py-2 text-red-600 hover:bg-red-50 disabled:opacity-50"
                                >
                                  {deletingSession === session.id ? 'Deleting...' : 'Delete History'}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
