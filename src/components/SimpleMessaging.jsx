"use client";
import { useState, useEffect, useRef } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function SimpleMessaging({ sessionId, counselorId, patientId }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [recipientId, setRecipientId] = useState(null);
  const messagesEndRef = useRef(null);

  const supabase = createClientComponentClient();

  // Get current user
  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error) {
          console.error('Error getting user:', error);
          setError('Error getting user. Please try refreshing the page.');
          return;
        }

        setUser(user);

        // Determine recipient ID
        if (user && counselorId && patientId) {
          if (user.id === counselorId) {
            setRecipientId(patientId);
          } else if (user.id === patientId) {
            setRecipientId(counselorId);
          }
        }
      } catch (err) {
        console.error('Error in getUser:', err);
        setError('An unexpected error occurred. Please try refreshing the page.');
      } finally {
        setLoading(false);
      }
    };

    getUser();
  }, [supabase, counselorId, patientId]);

  // Fetch messages
  useEffect(() => {
    const fetchMessages = async () => {
      if (!sessionId) return;

      try {
        setLoading(true);

        // Get messages directly from Supabase
        const { data, error } = await supabase
          .from('session_messages')
          .select('*')
          .eq('session_id', sessionId)
          .order('created_at', { ascending: true });

        if (error) {
          console.error('Error fetching messages:', error);
          setError('Error fetching messages. Please try refreshing the page.');
          return;
        }

        setMessages(data || []);
      } catch (err) {
        console.error('Error in fetchMessages:', err);
        setError('An unexpected error occurred. Please try refreshing the page.');
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();

    // Set up real-time subscription
    const channel = supabase
      .channel('session_messages_changes')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'session_messages',
        filter: `session_id=eq.${sessionId}`
      }, (payload) => {
        setMessages(prev => [...prev, payload.new]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, sessionId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send message
  const sendMessage = async (e) => {
    e.preventDefault();

    if (!newMessage.trim() || !user || !recipientId) {
      return;
    }

    try {
      setSending(true);
      setError(null);

      // Insert message directly
      const { error } = await supabase
        .from('session_messages')
        .insert({
          session_id: sessionId,
          sender_id: user.id,
          recipient_id: recipientId,
          message: newMessage.trim(),
          is_read: false
        });

      if (error) {
        console.error('Error sending message:', error);
        setError('Error sending message. Please try again.');
        return;
      }

      // Clear the input
      setNewMessage('');
    } catch (err) {
      console.error('Error in sendMessage:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setSending(false);
    }
  };

  if (loading && messages.length === 0) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 p-4 overflow-y-auto">
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin h-8 w-8 border-t-2 border-b-2 border-blue-500 rounded-full mr-3"></div>
            <p>Loading messages...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 p-4 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="flex justify-center items-center h-full">
            <p className="text-gray-500">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.sender_id === user?.id ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-xs md:max-w-md lg:max-w-lg xl:max-w-xl rounded-lg p-3 ${
                    message.sender_id === user?.id
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-800'
                  }`}
                >
                  <p>{message.message}</p>
                  <p className="text-xs mt-1 opacity-75">
                    {new Date(message.created_at).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mx-4 mb-4">
          <p>{error}</p>
        </div>
      )}

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
