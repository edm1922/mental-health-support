"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useUser } from '@/utils/useUser';
import { supabase } from '@/utils/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

export default function SessionMessaging({ sessionId, counselorId, patientId, otherPersonName }) {
  const { data: user } = useUser();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const [recipientId, setRecipientId] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [realtime, setRealtime] = useState(null);

  // Determine the recipient ID based on the user's role
  useEffect(() => {
    if (user && counselorId && patientId) {
      if (user.id === counselorId) {
        setRecipientId(patientId);
      } else if (user.id === patientId) {
        setRecipientId(counselorId);
      }
    }
  }, [user, counselorId, patientId]);

  // Create messages table and fix database relationships if needed
  const createMessagesTable = async () => {
    try {
      console.log('Attempting to create messages table...');
      const response = await fetch('/api/counseling/messages/create-table', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Error creating messages table:', data.error);
        return false;
      }

      console.log('Messages table created or already exists');

      // Now fix database relationships automatically
      console.log('Fixing database relationships...');
      const fixResponse = await fetch('/api/db/auto-fix', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (!fixResponse.ok) {
        console.error('Error fixing database relationships');
      } else {
        console.log('Database relationships fixed successfully');
      }

      return true;
    } catch (err) {
      console.error('Error creating messages table:', err);
      return false;
    }
  };

  // Fetch messages
  const fetchMessages = async () => {
    try {
      // Don't show loading state if we already have messages (to avoid flickering)
      if (messages.length === 0) {
        setLoading(true);
      }
      setError(null);

      // Get the current auth session
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        // Try to refresh the session
        const { data: refreshData } = await supabase.auth.refreshSession();
        if (!refreshData.session) {
          // Force a page reload to get a fresh session
          console.log('Authentication session not available, reloading page');
          window.location.reload();
          return;
        }
      }

      const response = await fetch(`/api/counseling/messages/get?sessionId=${sessionId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      const data = await response.json();

      if (!response.ok) {
        // If the error is about the table not existing, try to create it silently
        if (data.error && data.error.includes('not set up yet')) {
          await createMessagesTable();
          // Wait a moment for the table to be fully created
          await new Promise(resolve => setTimeout(resolve, 1000));
          // Try fetching messages again after creating the table
          return fetchMessages();
        }
        // If the error is about relationships, fix them automatically
        if (data.error && (data.error.includes('relationship') || data.error.includes('schema cache'))) {
          console.log('Relationship error detected, fixing database relationships...');
          // Fix database relationships
          const fixResponse = await fetch('/api/db/auto-fix', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            credentials: 'include'
          });

          if (fixResponse.ok) {
            console.log('Database relationships fixed successfully');
            // Wait a moment for the changes to take effect
            await new Promise(resolve => setTimeout(resolve, 1000));
            // Try fetching messages again
            return fetchMessages();
          }
        }
        // For other errors, log but don't show to user - we'll retry automatically
        console.error('Error response from messages API:', data.error);
        return;
      }

      // Successfully got messages
      console.log('Fetched messages:', data.messages);

      // Only update messages if we got some or if we currently have none
      if ((data.messages && data.messages.length > 0) || messages.length === 0) {
        setMessages(data.messages || []);
      } else if (!data.messages || data.messages.length === 0) {
        console.log('No messages returned from API, but we have some locally');
        // If we have messages locally but none from the API, keep our local messages
        // This prevents flickering of the UI
      }

      setError(null); // Clear any previous errors

      // Get unread count
      fetchUnreadCount();
    } catch (err) {
      console.error('Error fetching messages:', err);
      // Don't show errors to user - we'll retry automatically
    } finally {
      setLoading(false);
    }
  };

  // Fetch unread count
  const fetchUnreadCount = async () => {
    try {
      // Get the current auth session
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        // Just return silently - we'll retry automatically
        return;
      }

      const response = await fetch(`/api/counseling/messages/unread-count?sessionId=${sessionId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      const data = await response.json();

      if (!response.ok) {
        // If the error is about the table not existing, try to create it silently
        if (data.error && data.error.includes('not set up yet')) {
          await createMessagesTable();
          // Wait a moment for the table to be fully created
          await new Promise(resolve => setTimeout(resolve, 500));
          // Try fetching unread count again after creating the table
          return fetchUnreadCount();
        }
        // Just log the error and return - not critical
        console.log('Error fetching unread count:', data.error);
        return;
      }

      setUnreadCount(data.count || 0);
    } catch (err) {
      console.error('Error fetching unread count:', err);
      // Don't set error state here, as it's not critical
    }
  };

  // Send a message
  const sendMessage = async (e) => {
    e.preventDefault();

    if (!newMessage.trim()) {
      return;
    }

    if (!recipientId) {
      // Try to determine recipient ID again
      if (user && counselorId && patientId) {
        if (user.id === counselorId) {
          setRecipientId(patientId);
        } else if (user.id === patientId) {
          setRecipientId(counselorId);
        }
      }

      if (!recipientId) {
        // Don't show error, just log it
        console.log('Recipient not found, retrying initialization');
        // Retry initialization
        createMessagesTable().then(fetchMessages);
        return;
      }
    }

    try {
      setSending(true);
      setError(null);

      // Get the current auth session
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        // Try to refresh the session
        const { data: refreshData } = await supabase.auth.refreshSession();
        if (!refreshData.session) {
          // Force a page reload to get a fresh session
          console.log('Authentication session not available, reloading page');
          window.location.reload();
          return;
        }
      }

      const response = await fetch('/api/counseling/messages/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          sessionId,
          recipientId,
          message: newMessage.trim(),
          senderId: user?.id // Pass the user ID explicitly
        })
      });

      const data = await response.json();

      if (!response.ok) {
        // If the error is about the table not existing, try to create it silently
        if (data.error && data.error.includes('not set up yet')) {
          await createMessagesTable();
          // Wait a moment for the table to be fully created
          await new Promise(resolve => setTimeout(resolve, 1000));
          // Try sending the message again after creating the table
          return sendMessage(e);
        }

        // If the error is about relationships, fix them automatically
        if (data.error && (data.error.includes('relationship') || data.error.includes('schema cache'))) {
          console.log('Relationship error detected, fixing database relationships...');
          // Fix database relationships
          const fixResponse = await fetch('/api/db/auto-fix', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            credentials: 'include'
          });

          if (fixResponse.ok) {
            console.log('Database relationships fixed successfully');
            // Wait a moment for the changes to take effect
            await new Promise(resolve => setTimeout(resolve, 1000));
            // Try sending the message again
            return sendMessage(e);
          }
        }

        // If we need to refresh authentication
        if (data.needsRefresh) {
          console.log('Authentication refresh needed, reloading page');
          window.location.reload();
          return;
        }

        // Log the error but don't show to user
        console.error('Error response from send message API:', data.error);
        // Retry initialization
        setTimeout(() => {
          createMessagesTable().then(fetchMessages);
        }, 1000);
        return;
      }

      // Add the new message to the list
      const newMsg = data.message;

      // Check if we need to enhance the message with user info
      let enhancedMessage = newMsg;

      // If the message doesn't have sender/recipient objects but has IDs, add display info
      if ((!newMsg.sender || !newMsg.sender.display_name) && newMsg.sender_id) {
        // For the current user (sender), we can use the otherPersonName prop
        enhancedMessage = {
          ...newMsg,
          sender: {
            id: newMsg.sender_id,
            display_name: user?.display_name || 'You'
          },
          recipient: {
            id: newMsg.recipient_id,
            display_name: otherPersonName || 'Recipient'
          }
        };
      }

      console.log('Adding sent message to UI:', enhancedMessage);

      // Use a function to update messages to ensure we have the latest state
      setMessages(prevMessages => {
        // Check if the message is already in the list (by ID or content)
        const isDuplicate = prevMessages.some(msg =>
          (msg.id && msg.id === enhancedMessage.id) ||
          (msg.message === enhancedMessage.message &&
           msg.sender_id === enhancedMessage.sender_id &&
           Math.abs(new Date(msg.created_at) - new Date(enhancedMessage.created_at)) < 5000)
        );

        if (isDuplicate) {
          console.log('Duplicate message detected, not adding again');
          return prevMessages;
        }

        return [...prevMessages, enhancedMessage];
      });

      // Clear the input
      setNewMessage('');

      // Clear any previous errors
      setError(null);

      // Scroll to bottom
      scrollToBottom();

      // Force a refresh of messages after a short delay
      setTimeout(() => {
        fetchMessages();
      }, 1000);
    } catch (err) {
      console.error('Error sending message:', err);

      // Create a temporary message to show in the UI
      const tempMessage = {
        id: 'temp-' + Date.now(),
        session_id: sessionId,
        sender_id: user?.id,
        recipient_id: recipientId,
        message: newMessage.trim(),
        is_read: false,
        created_at: new Date().toISOString(),
        sender: {
          id: user?.id,
          display_name: user?.display_name || 'You'
        },
        recipient: {
          id: recipientId,
          display_name: otherPersonName || 'Recipient'
        },
        isTemporary: true // Flag to identify temporary messages
      };

      console.log('Adding temporary message due to send error:', tempMessage);

      // Add the temporary message to the UI
      setMessages(prevMessages => [...prevMessages, tempMessage]);

      // Clear the input
      setNewMessage('');

      // Scroll to bottom
      scrollToBottom();

      // Don't show errors to user, just log them
      // Retry initialization silently
      setTimeout(() => {
        createMessagesTable().then(fetchMessages);
      }, 1000);
    } finally {
      setSending(false);
    }
  };

  // Set up realtime subscription
  useEffect(() => {
    if (!sessionId) return;

    // Set up realtime subscription
    const channel = supabase
      .channel(`session_messages:${sessionId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'session_messages',
        filter: `session_id=eq.${sessionId}`
      }, (payload) => {
        console.log('Realtime message received:', payload.new);

        // Only add the message if it's not already in the list
        if (!messages.some(msg => msg.id === payload.new.id)) {
          // Fetch the sender and recipient details
          const fetchMessageDetails = async () => {
            try {
              const { data: senderData, error: senderError } = await supabase
                .from('user_profiles')
                .select('id, display_name')
                .eq('id', payload.new.sender_id)
                .single();

              const { data: recipientData, error: recipientError } = await supabase
                .from('user_profiles')
                .select('id, display_name')
                .eq('id', payload.new.recipient_id)
                .single();

              // Even if there are errors, we'll still add the message with default values
              let newMessage = {
                ...payload.new,
                sender: senderError ? { id: payload.new.sender_id, display_name: 'Unknown' } : senderData,
                recipient: recipientError ? { id: payload.new.recipient_id, display_name: 'Unknown' } : recipientData
              };

              console.log('Adding new message from realtime:', newMessage);
              setMessages(prevMessages => [...prevMessages, newMessage]);

              // If the user is the recipient, mark the message as read
              if (user && payload.new.recipient_id === user.id) {
                fetchUnreadCount();
              }

              // Scroll to bottom
              scrollToBottom();
            } catch (err) {
              console.error('Error fetching message details:', err);

              // Still add the message even if there's an error
              const newMessage = {
                ...payload.new,
                sender: { id: payload.new.sender_id, display_name: user && payload.new.sender_id === user.id ? 'You' : 'Unknown' },
                recipient: { id: payload.new.recipient_id, display_name: 'Unknown' }
              };

              console.log('Adding new message with default values:', newMessage);
              setMessages(prevMessages => [...prevMessages, newMessage]);
              scrollToBottom();
            }
          };

          fetchMessageDetails();
        }
      });

    // Start the subscription
    channel.subscribe((status) => {
      console.log(`Realtime subscription status: ${status}`);
      if (status === 'SUBSCRIBED') {
        console.log(`Successfully subscribed to channel session_messages:${sessionId}`);
      }
    });
    setRealtime(channel);

    // Clean up on unmount
    return () => {
      if (channel) {
        console.log('Removing realtime subscription');
        supabase.removeChannel(channel);
      }
    };
  }, [sessionId, user]);  // Remove messages from dependency array to prevent re-subscribing

  // Automatically handle authentication, table creation, and database relationships
  useEffect(() => {
    const initializeMessaging = async () => {
      if (!sessionId) return;

      try {
        setLoading(true);
        setError(null);

        // First, ensure we have a valid session
        const { data: { session: authSession } } = await supabase.auth.getSession();

        if (!authSession) {
          // Try to refresh the session
          const { data: refreshData } = await supabase.auth.refreshSession();
          if (!refreshData.session) {
            console.log('Unable to refresh authentication session, reloading page');
            // Force a page reload to get a fresh session
            window.location.reload();
            return;
          }
        }

        // Create the messages table if it doesn't exist
        // This will also fix database relationships
        await createMessagesTable();

        // Fix database relationships explicitly to ensure they're set up correctly
        console.log('Fixing database relationships during initialization...');
        try {
          const fixResponse = await fetch('/api/db/auto-fix', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            credentials: 'include'
          });

          if (fixResponse.ok) {
            console.log('Database relationships fixed successfully during initialization');
          } else {
            console.error('Error fixing database relationships during initialization');
          }
        } catch (fixErr) {
          console.error('Error fixing database relationships:', fixErr);
        }

        // Then fetch messages
        await fetchMessages();
      } catch (err) {
        console.error('Error initializing messaging:', err);
        // If we get an authentication error, reload the page
        if (err.message && (err.message.includes('authentication') || err.message.includes('auth'))) {
          console.log('Authentication error detected, reloading page');
          window.location.reload();
          return;
        }
        // Don't show error to user, we'll retry silently
      } finally {
        setLoading(false);
      }
    };

    // Initialize immediately
    initializeMessaging();

    // Set up a retry mechanism
    const retryInterval = setInterval(() => {
      if (error) {
        console.log('Retrying messaging initialization...');
        initializeMessaging();
      }
    }, 5000); // Retry every 5 seconds if there's an error

    // Also set up a periodic refresh to make sure we have the latest messages
    const refreshInterval = setInterval(() => {
      if (!loading && sessionId) {
        console.log('Periodic refresh of messages');
        fetchMessages();
      }
    }, 10000); // Refresh every 10 seconds

    return () => {
      clearInterval(retryInterval);
      clearInterval(refreshInterval);
    };
  }, [sessionId, user]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Scroll to bottom function
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Check if a message is from the current user
  const isFromCurrentUser = (senderId) => {
    if (!user) return false;

    // Handle different message formats
    if (typeof senderId === 'object' && senderId !== null) {
      // If senderId is an object (like a sender object), check its id property
      return senderId.id === user.id;
    }

    return senderId === user.id;
  };

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      <div className="p-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white flex justify-between items-center">
        <h2 className="text-lg font-semibold">Messages with {otherPersonName}</h2>
        {unreadCount > 0 && (
          <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
            {unreadCount} unread
          </span>
        )}
      </div>

      <div className="h-96 overflow-y-auto p-4 bg-gray-50">
        {loading && messages.length === 0 ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-500 p-4">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${isFromCurrentUser(message.sender_id) ? 'justify-end' : 'justify-start'}`}
              >
                <div className="flex flex-col">
                  {!isFromCurrentUser(message.sender_id) && (
                    <p className="text-xs text-gray-600 ml-2 mb-1">
                      {message.sender?.display_name || 'Unknown'}
                    </p>
                  )}
                  <div
                    className={`max-w-xs md:max-w-md rounded-lg p-3 ${
                      isFromCurrentUser(message.sender_id)
                        ? message.isTemporary
                          ? 'bg-blue-300 text-white rounded-br-none' // Lighter blue for temporary messages
                          : 'bg-blue-500 text-white rounded-br-none'
                        : 'bg-gray-200 text-gray-800 rounded-bl-none'
                    }`}
                  >
                    <p className="text-sm">{message.message}</p>
                    <div className="flex items-center justify-between">
                      <p className={`text-xs mt-1 ${isFromCurrentUser(message.sender_id) ? 'text-blue-100' : 'text-gray-500'}`}>
                        {formatDate(message.created_at)}
                      </p>
                      {message.isTemporary && (
                        <span className="text-xs text-blue-100 ml-2 italic">sending...</span>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <form onSubmit={sendMessage} className="p-4 border-t border-gray-200">
        <div className="flex">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 rounded-l-lg border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={sending}
          />
          <button
            type="submit"
            className={`bg-blue-500 text-white px-4 py-2 rounded-r-lg ${
              sending ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-600'
            }`}
            disabled={sending || !newMessage.trim()}
          >
            {sending ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Sending
              </span>
            ) : (
              'Send'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
