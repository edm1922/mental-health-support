"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabaseClient';

export default function TestMessageInsertPage() {
  const [sessionId, setSessionId] = useState('');
  const [senderId, setSenderId] = useState('');
  const [recipientId, setRecipientId] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [messages, setMessages] = useState([]);
  const [user, setUser] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Fetch user and sessions on load
  useEffect(() => {
    const fetchUserAndSessions = async () => {
      try {
        // Get current user
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        setUser(currentUser);
        
        if (currentUser) {
          setSenderId(currentUser.id);
          
          // Get sessions
          const { data: sessionsData, error: sessionsError } = await supabase
            .from('counseling_sessions')
            .select('*')
            .or(`counselor_id.eq.${currentUser.id},patient_id.eq.${currentUser.id}`);
          
          if (sessionsError) {
            console.error('Error fetching sessions:', sessionsError);
            return;
          }
          
          setSessions(sessionsData || []);
          
          // If there's at least one session, select it by default
          if (sessionsData && sessionsData.length > 0) {
            setSessionId(sessionsData[0].id);
            
            // Set recipient ID based on the selected session
            if (sessionsData[0].counselor_id === currentUser.id) {
              setRecipientId(sessionsData[0].patient_id);
            } else {
              setRecipientId(sessionsData[0].counselor_id);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching user and sessions:', err);
      }
    };
    
    fetchUserAndSessions();
  }, []);
  
  // Fetch messages when session changes or after sending a message
  useEffect(() => {
    const fetchMessages = async () => {
      if (!sessionId) return;
      
      try {
        // First, ensure RLS is disabled
        try {
          await fetch('/api/disable-rls');
        } catch (rlsError) {
          console.error('Error disabling RLS:', rlsError);
          // Continue anyway
        }
        
        // Get messages for the selected session
        const { data, error } = await supabase
          .from('session_messages')
          .select('*')
          .eq('session_id', sessionId)
          .order('created_at', { ascending: true });
        
        if (error) {
          console.error('Error fetching messages:', error);
          return;
        }
        
        setMessages(data || []);
      } catch (err) {
        console.error('Error fetching messages:', err);
      }
    };
    
    fetchMessages();
    
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
        setMessages(prev => [...prev, payload.new]);
      })
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, refreshTrigger]);
  
  // Handle session change
  const handleSessionChange = (e) => {
    const newSessionId = e.target.value;
    setSessionId(newSessionId);
    
    // Find the session
    const session = sessions.find(s => s.id === newSessionId);
    if (session) {
      // Set recipient ID based on the selected session
      if (session.counselor_id === user?.id) {
        setRecipientId(session.patient_id);
      } else {
        setRecipientId(session.counselor_id);
      }
    }
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!sessionId || !senderId || !recipientId || !message.trim()) {
      setError('All fields are required');
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Call the force-insert API
      const response = await fetch('/api/messages/force-insert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sessionId,
          senderId,
          recipientId,
          message: message.trim()
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        setError(`Error: ${data.error || 'Failed to send message'}`);
        console.error('Error response:', data);
      } else {
        setSuccess(`Success: ${data.message}`);
        setMessage(''); // Clear the message input
        setRefreshTrigger(prev => prev + 1); // Trigger a refresh of messages
      }
    } catch (err) {
      setError(`Error: ${err.message}`);
      console.error('Exception:', err);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle disabling RLS
  const handleDisableRLS = async () => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/simple-disable-rls');
      const data = await response.json();
      
      if (!response.ok) {
        setError(`Error disabling RLS: ${data.error}`);
      } else {
        setSuccess(`RLS disabled successfully: ${data.message}`);
      }
    } catch (err) {
      setError(`Error disabling RLS: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Test Message Insertion</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Disable RLS</h2>
        <button
          onClick={handleDisableRLS}
          disabled={loading}
          className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
        >
          {loading ? 'Processing...' : 'Disable RLS Permanently'}
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Message Form */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Send Message</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Session
              </label>
              <select
                value={sessionId}
                onChange={handleSessionChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              >
                <option value="">Select a session</option>
                {sessions.map(session => (
                  <option key={session.id} value={session.id}>
                    Session {session.id.substring(0, 8)}...
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sender ID
              </label>
              <input
                type="text"
                value={senderId}
                onChange={(e) => setSenderId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Recipient ID
              </label>
              <input
                type="text"
                value={recipientId}
                onChange={(e) => setRecipientId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Message
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                rows="3"
                required
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Send Message'}
            </button>
          </form>
          
          {error && (
            <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}
          
          {success && (
            <div className="mt-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
              {success}
            </div>
          )}
        </div>
        
        {/* Messages Display */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Messages</h2>
          
          <div className="border border-gray-200 rounded-md p-4 h-96 overflow-y-auto">
            {messages.length === 0 ? (
              <p className="text-gray-500 text-center">No messages yet</p>
            ) : (
              <div className="space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`p-3 rounded-lg max-w-[80%] ${
                      msg.sender_id === user?.id
                        ? 'ml-auto bg-blue-500 text-white'
                        : 'bg-gray-200 text-gray-800'
                    }`}
                  >
                    <p className="text-sm">{msg.message}</p>
                    <p className="text-xs mt-1 opacity-70">
                      {new Date(msg.created_at).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
