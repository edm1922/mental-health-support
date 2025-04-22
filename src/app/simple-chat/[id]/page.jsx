"use client";
import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import SimpleMessaging from '@/components/SimpleMessaging';
import Link from 'next/link';

export default function SimpleChat({ params }) {
  const sessionId = params.id;
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);

  const supabase = createClientComponentClient();

  useEffect(() => {
    const setupChat = async () => {
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

        // Get session details
        const { data: sessionData, error: sessionError } = await supabase
          .from('counseling_sessions')
          .select('*')
          .eq('id', sessionId)
          .single();

        if (sessionError) {
          console.error('Error getting session:', sessionError);
          setError('Error getting session details. Please try refreshing the page.');
          return;
        }

        setSession(sessionData);

        // Create insert_message function
        try {
          await fetch('/api/create-insert-message-function');
          console.log('insert_message function created successfully');
        } catch (err) {
          console.error('Error creating insert_message function:', err);
        }

        // Disable RLS for testing
        try {
          const response = await fetch('/api/disable-rls');
          const data = await response.json();

          if (!response.ok) {
            console.error('Error disabling RLS:', data.error);
          } else {
            console.log('RLS disabled successfully');
          }
        } catch (error) {
          console.error('Error disabling RLS:', error);
        }
      } catch (err) {
        console.error('Error in setupChat:', err);
        setError('An unexpected error occurred. Please try refreshing the page.');
      } finally {
        setLoading(false);
      }
    };

    setupChat();
  }, [supabase, sessionId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4 flex flex-col">
        <div className="flex justify-center items-center h-full">
          <div className="animate-spin h-8 w-8 border-t-2 border-b-2 border-blue-500 rounded-full mr-3"></div>
          <p>Loading session...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4 flex flex-col">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>{error}</p>
        </div>
        <Link
          href="/counseling/sessions"
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg self-start"
        >
          Back to Sessions
        </Link>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4 flex flex-col">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
          <p>Session not found.</p>
        </div>
        <Link
          href="/counseling/sessions"
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg self-start"
        >
          Back to Sessions
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4 flex flex-col">
      <div className="mb-4 flex justify-between items-center">
        <Link
          href="/counseling/sessions"
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg"
        >
          Back to Sessions
        </Link>

        <h1 className="text-xl font-bold">Simple Chat</h1>

        <div className="flex space-x-2">
          <button
            onClick={async () => {
              try {
                const response = await fetch('/api/disable-rls');
                const data = await response.json();

                if (!response.ok) {
                  console.error('Error disabling RLS:', data.error);
                  alert('Error disabling RLS: ' + data.error);
                } else {
                  console.log('RLS disabled successfully');
                  alert('RLS disabled successfully');
                }
              } catch (error) {
                console.error('Error disabling RLS:', error);
                alert('Error disabling RLS: ' + error.message);
              }
            }}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg"
          >
            Disable RLS
          </button>

          <button
            onClick={async () => {
              try {
                await fetch('/api/create-insert-message-function');
                alert('insert_message function created successfully');
              } catch (err) {
                console.error('Error creating insert_message function:', err);
                alert('Error creating insert_message function: ' + err.message);
              }
            }}
            className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg"
          >
            Create Function
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md p-4 mb-4">
        <h2 className="text-lg font-semibold mb-2">Session Details</h2>
        <p><strong>Session ID:</strong> {session.id}</p>
        <p><strong>Counselor ID:</strong> {session.counselor_id}</p>
        <p><strong>Patient ID:</strong> {session.patient_id}</p>
        <p><strong>Date:</strong> {new Date(session.session_date).toLocaleString()}</p>
        <p><strong>Status:</strong> {session.status}</p>
      </div>

      <div className="bg-white rounded-xl shadow-md flex-1 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Messages</h2>
        </div>

        <div className="flex-1 flex flex-col overflow-hidden">
          <SimpleMessaging
            sessionId={sessionId}
            counselorId={session.counselor_id}
            patientId={session.patient_id}
          />
        </div>
      </div>
    </div>
  );
}
