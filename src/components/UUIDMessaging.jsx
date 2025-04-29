"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "@/utils/supabaseClient";
import { motion } from "framer-motion";

export default function UUIDMessaging({ sessionId, userId }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [sessionDetails, setSessionDetails] = useState(null);
  const [isClient, setIsClient] = useState(false);

  // Effect to set isClient to true after mount
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Fetch session details
  useEffect(() => {
    const getSessionDetails = async () => {
      if (!sessionId || !isClient) return;

      try {
        const { data, error } = await supabase
          .from("counseling_sessions")
          .select(`
            *,
            counselor:counselor_id (id, display_name, image_url),
            patient:patient_id (id, display_name, image_url)
          `)
          .eq("id", sessionId)
          .single();

        if (error) {
          console.error("Error fetching session details:", error);
          return;
        }

        setSessionDetails(data);
      } catch (err) {
        console.error("Error in getSessionDetails:", err);
      }
    };

    getSessionDetails();
  }, [sessionId, isClient]);

  // Fetch messages for this session
  useEffect(() => {
    const fetchMessages = async () => {
      if (!sessionId || !userId || !isClient) return;

      try {
        setLoading(true);
        setError(null);

        console.log('Fetching messages for session:', sessionId);
        console.log('Current user ID:', userId);

        // Get messages for this session
        const { data, error } = await supabase
          .from("session_messages")
          .select(`
            id,
            message,
            sender_id,
            recipient_id,
            created_at,
            is_read
          `)
          .eq("session_id", sessionId)
          .order("created_at", { ascending: true });

        if (error) {
          console.error("Error fetching messages:", error);
          setError("Failed to load messages");
          return;
        }

        console.log('Messages found for session:', data?.length || 0);

        // Get user profiles for senders and recipients
        const userIds = [...new Set(data.flatMap(msg => [msg.sender_id, msg.recipient_id]))];

        const { data: profiles, error: profilesError } = await supabase
          .from("user_profiles")
          .select("id, display_name, image_url")
          .in("id", userIds);

        if (profilesError) {
          console.error("Error fetching user profiles:", profilesError);
        }

        // Create a map of user IDs to profiles
        const userProfiles = {};
        if (profiles) {
          profiles.forEach(profile => {
            userProfiles[profile.id] = profile;
          });
        }

        // Add user profile info to messages
        const messagesWithProfiles = data.map(msg => ({
          ...msg,
          sender: userProfiles[msg.sender_id] || { display_name: "Unknown" },
          recipient: userProfiles[msg.recipient_id] || { display_name: "Unknown" }
        }));

        setMessages(messagesWithProfiles);

        // Mark unread messages as read
        const unreadMessages = data.filter(
          msg => msg.recipient_id === userId && !msg.is_read
        );

        if (unreadMessages.length > 0) {
          const unreadIds = unreadMessages.map(msg => msg.id);
          await supabase
            .from("session_messages")
            .update({ is_read: true })
            .in("id", unreadIds);
        }
      } catch (err) {
        console.error("Error fetching messages:", err);
        setError("An unexpected error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();

    // Set up real-time subscription for new messages
    const subscription = supabase
      .channel(`session_messages:${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "session_messages",
          filter: `session_id=eq.${sessionId}`
        },
        () => {
          fetchMessages();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [sessionId, userId, isClient]);

  // Send a new message
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !sessionId || !userId || !sessionDetails) return;

    try {
      setSending(true);
      setError(null);

      // Determine recipient ID (the other person in the session)
      const recipientId = sessionDetails.counselor_id === userId
        ? sessionDetails.patient_id
        : sessionDetails.counselor_id;

      // Insert the new message
      const { error } = await supabase.from("session_messages").insert({
        session_id: sessionId,
        sender_id: userId,
        recipient_id: recipientId,
        message: newMessage.trim(),
        is_read: false
      });

      if (error) {
        console.error("Error sending message:", error);
        setError("Failed to send message");
        return;
      }

      // Clear the input
      setNewMessage("");
    } catch (err) {
      console.error("Error in sendMessage:", err);
      setError("An unexpected error occurred");
    } finally {
      setSending(false);
    }
  };

  // If we're not on the client yet, render a placeholder to avoid hydration issues
  if (!isClient) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-blue-500"></div>
      </div>
    );
  }

  if (!sessionId) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <p className="text-gray-500">Select a session to view messages</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Session header */}
      {sessionDetails && (
        <div className="border-b border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center">
            <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-full bg-gray-200">
              {sessionDetails.counselor_id === userId ? (
                sessionDetails.patient?.image_url ? (
                  <img
                    src={sessionDetails.patient.image_url}
                    alt={sessionDetails.patient.display_name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-blue-100 text-blue-500">
                    {sessionDetails.patient?.display_name?.charAt(0) || "P"}
                  </div>
                )
              ) : sessionDetails.counselor?.image_url ? (
                <img
                  src={sessionDetails.counselor.image_url}
                  alt={sessionDetails.counselor.display_name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-green-100 text-green-500">
                  {sessionDetails.counselor?.display_name?.charAt(0) || "C"}
                </div>
              )}
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-medium text-gray-900">
                {sessionDetails.counselor_id === userId
                  ? sessionDetails.patient?.display_name || "Patient"
                  : sessionDetails.counselor?.display_name || "Counselor"}
              </h3>
              <p className="text-sm text-gray-500">
                {new Date(sessionDetails.session_date).toLocaleDateString()}
                {sessionDetails.status && ` • ${sessionDetails.status}`}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto bg-gray-50 p-4">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-blue-500"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center">
            <div className="mb-4 rounded-full bg-blue-100 p-4 text-blue-500">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                />
              </svg>
            </div>
            <p className="text-center text-gray-500">
              No messages yet. Start the conversation!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message, index) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.2 }}
                className={`flex ${
                  message.sender_id === userId ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 shadow-sm ${
                    message.sender_id === userId
                      ? "bg-blue-500 text-white"
                      : "bg-white text-gray-800"
                  }`}
                >
                  <p>{message.message}</p>
                  <p
                    className={`mt-1 text-right text-xs ${
                      message.sender_id === userId
                        ? "text-blue-100"
                        : "text-gray-500"
                    }`}
                  >
                    {new Date(message.created_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Message input */}
      <div className="border-t border-gray-200 bg-white p-4">
        {error && (
          <div className="mb-2 rounded-md bg-red-50 p-2 text-sm text-red-600">
            {error}
          </div>
        )}
        <form onSubmit={sendMessage} className="flex">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 rounded-l-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            disabled={sending}
          />
          <button
            type="submit"
            className="rounded-r-lg bg-blue-500 px-4 py-2 font-medium text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-300"
            disabled={sending || !newMessage.trim()}
          >
            {sending ? (
              <span className="flex items-center">
                <svg
                  className="mr-2 h-4 w-4 animate-spin"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Sending
              </span>
            ) : (
              "Send"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
