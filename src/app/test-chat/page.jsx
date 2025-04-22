"use client";
import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Link from 'next/link';
import dynamic from 'next/dynamic';

// Dynamically import the SimpleChat component with no SSR
const SimpleChat = dynamic(
  () => import('@/components/SimpleChat'),
  { ssr: false }
);

export default function TestChatPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [newSessionData, setNewSessionData] = useState({
    counselor_id: '',
    patient_id: '',
    session_date: new Date().toISOString().split('T')[0],
    status: 'scheduled'
  });

  const supabase = createClientComponentClient();

  useEffect(() => {
    const getUser = async () => {
      try {
        setLoading(true);

        const { data: { user }, error } = await supabase.auth.getUser();

        if (error) {
          console.error('Error getting user:', error);
          setError(error.message);
          return;
        }

        setUser(user);

        // Get sessions
        if (user) {
          const { data: sessionsData, error: sessionsError } = await supabase
            .from('counseling_sessions')
            .select('*')
            .or(`counselor_id.eq.${user.id},patient_id.eq.${user.id}`);

          if (sessionsError) {
            console.error('Error getting sessions:', sessionsError);
          } else {
            setSessions(sessionsData || []);

            // Set the current user ID as the counselor ID for new sessions
            setNewSessionData(prev => ({
              ...prev,
              counselor_id: user.id
            }));

            // Select the first session if available
            if (sessionsData && sessionsData.length > 0) {
              setSelectedSessionId(sessionsData[0].id);
            }
          }
        }
      } catch (err) {
        console.error('Error in getUser:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    getUser();
  }, [supabase]);

  const createSession = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!newSessionData.counselor_id || !newSessionData.patient_id) {
        setError('Counselor ID and Patient ID are required');
        return;
      }

      // Insert the new session
      const { data, error } = await supabase
        .from('counseling_sessions')
        .insert({
          counselor_id: newSessionData.counselor_id,
          patient_id: newSessionData.patient_id,
          session_date: newSessionData.session_date,
          status: newSessionData.status
        })
        .select();

      if (error) {
        console.error('Error creating session:', error);
        setError(error.message);
        return;
      }

      // Refresh the sessions list
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('counseling_sessions')
        .select('*')
        .or(`counselor_id.eq.${user.id},patient_id.eq.${user.id}`);

      if (sessionsError) {
        console.error('Error getting sessions:', sessionsError);
      } else {
        setSessions(sessionsData || []);

        // Select the newly created session
        if (data && data.length > 0) {
          setSelectedSessionId(data[0].id);
        }
      }

      alert('Session created successfully!');
    } catch (err) {
      console.error('Error creating session:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const disableRLS = async () => {
    try {
      setLoading(true);
      setError(null);

      // Use the disable-rls API to disable RLS on all tables
      const response = await fetch('/api/disable-rls');
      const data = await response.json();

      if (!response.ok) {
        console.error('Error disabling RLS:', data.error);
        setError(data.error);
        return;
      }

      alert('RLS disabled successfully on all relevant tables!');
    } catch (err) {
      console.error('Error disabling RLS:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Test Chat</h1>

        <div className="mb-6 flex flex-wrap gap-4">
          <Link
            href="/counseling/sessions"
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg"
          >
            Back to Sessions
          </Link>

          <button
            onClick={disableRLS}
            className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg"
          >
            Disable RLS on All Tables
          </button>
        </div>

        {user ? (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
            <p>Logged in as: {user.email}</p>
            <p>User ID: {user.id}</p>
          </div>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg mb-6">
            <p>Not logged in</p>
          </div>
        )}

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
            <p>{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left sidebar - Sessions list */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-xl shadow-md p-6 mb-6">
              <h2 className="text-lg font-semibold mb-4">Your Sessions</h2>

              {sessions.length === 0 ? (
                <p className="text-gray-500">No sessions found.</p>
              ) : (
                <div className="space-y-4">
                  {sessions.map((session) => (
                    <div
                      key={session.id}
                      className={`border rounded-lg p-4 cursor-pointer transition-all ${
                        selectedSessionId === session.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                      }`}
                      onClick={() => setSelectedSessionId(session.id)}
                    >
                      <p><strong>Session ID:</strong> {session.id}</p>
                      <p><strong>Date:</strong> {new Date(session.session_date).toLocaleDateString()}</p>
                      <p><strong>Status:</strong> {session.status}</p>

                      <div className="mt-2 flex space-x-2">
                        <Link
                          href={`/counseling/session/${session.id}`}
                          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-1 px-3 rounded-lg text-sm"
                        >
                          Open
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-lg font-semibold mb-4">Create New Session</h2>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Counselor ID
                </label>
                <input
                  type="text"
                  value={newSessionData.counselor_id}
                  onChange={(e) => setNewSessionData(prev => ({ ...prev, counselor_id: e.target.value }))}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  placeholder="Enter counselor ID"
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Patient ID
                </label>
                <input
                  type="text"
                  value={newSessionData.patient_id}
                  onChange={(e) => setNewSessionData(prev => ({ ...prev, patient_id: e.target.value }))}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  placeholder="Enter patient ID"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Tip: Use your own ID to create a self-chat for testing
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Session Date
                </label>
                <input
                  type="date"
                  value={newSessionData.session_date}
                  onChange={(e) => setNewSessionData(prev => ({ ...prev, session_date: e.target.value }))}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Status
                </label>
                <select
                  value={newSessionData.status}
                  onChange={(e) => setNewSessionData(prev => ({ ...prev, status: e.target.value }))}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                >
                  <option value="scheduled">Scheduled</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="pending">Pending</option>
                </select>
              </div>

              <button
                onClick={createSession}
                disabled={loading}
                className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50 w-full"
              >
                Create Session
              </button>
            </div>
          </div>

          {/* Right side - Chat */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-xl shadow-md p-6 h-[700px] flex flex-col">
              <h2 className="text-lg font-semibold mb-4">
                {selectedSessionId ? 'Chat' : 'Select a Session'}
              </h2>

              {selectedSessionId ? (
                <div className="flex-1 overflow-hidden rounded-lg border border-gray-200">
                  {/* Pass the selected session details to SimpleChat */}
                  <SimpleChat
                    sessionId={selectedSessionId}
                    counselorId={sessions.find(s => s.id === selectedSessionId)?.counselor_id}
                    patientId={sessions.find(s => s.id === selectedSessionId)?.patient_id}
                  />
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-gray-500">Select a session from the list or create a new one</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
