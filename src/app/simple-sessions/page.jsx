"use client";
import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Link from 'next/link';

export default function SimpleSessionsPage() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);

  const supabase = createClientComponentClient();

  useEffect(() => {
    const getSessions = async () => {
      try {
        setLoading(true);

        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError) {
          console.error('Error getting user:', userError);
          setError('Error getting user. Please try refreshing the page.');
          return;
        }

        setUser(user);

        // Get sessions
        const { data, error } = await supabase
          .from('counseling_sessions')
          .select('*')
          .or(`counselor_id.eq.${user.id},patient_id.eq.${user.id}`);

        if (error) {
          console.error('Error getting sessions:', error);
          setError('Error getting sessions. Please try refreshing the page.');
          return;
        }

        setSessions(data || []);
      } catch (err) {
        console.error('Error in getSessions:', err);
        setError('An unexpected error occurred. Please try refreshing the page.');
      } finally {
        setLoading(false);
      }
    };

    getSessions();
  }, [supabase]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin h-8 w-8 border-t-2 border-b-2 border-blue-500 rounded-full mr-3"></div>
            <p>Loading sessions...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Simple Counseling Sessions</h1>

          <div className="flex space-x-4">
            <Link
              href="/counseling/sessions"
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg"
            >
              Regular Sessions
            </Link>
          </div>
        </div>

        {user && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
            <p>Logged in as: {user.email}</p>
            <p>User ID: {user.id}</p>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Fix Chat Issues</h2>
          <div className="flex space-x-4">
            <button
              onClick={async () => {
                try {
                  const response = await fetch('/api/disable-rls');
                  const data = await response.json();

                  if (response.ok) {
                    alert(`Success: ${data.message}`);
                  } else {
                    alert(`Error: ${data.error}`);
                  }
                } catch (err) {
                  console.error('Error disabling RLS:', err);
                  alert(`Error: ${err.message}`);
                }
              }}
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg"
            >
              Disable RLS
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
            <p>{error}</p>
          </div>
        )}

        {sessions.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-6">
            <p className="text-gray-500">No sessions found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {sessions.map((session) => (
              <div key={session.id} className="bg-white rounded-xl shadow-md p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-lg font-semibold mb-2">
                      Session with {session.counselor_id === user?.id ? 'Patient' : 'Counselor'}
                    </h2>
                    <p><strong>Session ID:</strong> {session.id}</p>
                    <p><strong>Date:</strong> {new Date(session.session_date).toLocaleString()}</p>
                    <p><strong>Status:</strong> {session.status}</p>
                  </div>

                  <Link
                    href={`/simple-chat/${session.id}`}
                    className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg"
                  >
                    Open Simple Chat
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
