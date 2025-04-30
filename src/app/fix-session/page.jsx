"use client";
import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Link from 'next/link';

export default function FixSessionPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [sessionId, setSessionId] = useState('');
  const [checkResult, setCheckResult] = useState(null);
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
  
  const checkSession = async () => {
    try {
      setLoading(true);
      setError(null);
      setCheckResult(null);
      
      if (!sessionId) {
        setError('Please enter a session ID');
        return;
      }
      
      const response = await fetch(`/api/check-session?id=${sessionId}`);
      const data = await response.json();
      
      setCheckResult(data);
    } catch (err) {
      console.error('Error checking session:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
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
      }
      
      alert('Session created successfully!');
    } catch (err) {
      console.error('Error creating session:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  const fixSession = async (id) => {
    try {
      setLoading(true);
      setError(null);
      
      // Get the session details
      const { data: sessionData, error: sessionError } = await supabase
        .from('counseling_sessions')
        .select('*')
        .eq('id', id)
        .single();
      
      if (sessionError) {
        console.error('Error getting session:', sessionError);
        setError(sessionError.message);
        return;
      }
      
      // Update the session with the current user as both counselor and patient if needed
      const updates = {};
      
      if (!sessionData.counselor_id) {
        updates.counselor_id = user.id;
      }
      
      if (!sessionData.patient_id) {
        updates.patient_id = user.id;
      }
      
      if (Object.keys(updates).length > 0) {
        const { error: updateError } = await supabase
          .from('counseling_sessions')
          .update(updates)
          .eq('id', id);
        
        if (updateError) {
          console.error('Error updating session:', updateError);
          setError(updateError.message);
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
        }
        
        alert('Session fixed successfully!');
      } else {
        alert('Session already has counselor and patient IDs');
      }
    } catch (err) {
      console.error('Error fixing session:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Fix Session Issues</h1>
        
        <div className="mb-6 flex flex-wrap gap-4">
          <Link
            href="/counseling/sessions"
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg"
          >
            Back to Sessions
          </Link>
          
          <Link
            href="/chat-debug-tools"
            className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 px-4 rounded-lg"
          >
            Debug Tools
          </Link>
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
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-lg font-semibold mb-4">Check Session</h2>
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Session ID
              </label>
              <input
                type="text"
                value={sessionId}
                onChange={(e) => setSessionId(e.target.value)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                placeholder="Enter session ID"
              />
            </div>
            
            <button
              onClick={checkSession}
              disabled={loading}
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50"
            >
              Check Session
            </button>
            
            {checkResult && (
              <div className="mt-4">
                <h3 className="font-medium mb-2">Result:</h3>
                <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">
                  {JSON.stringify(checkResult, null, 2)}
                </pre>
                
                {!checkResult.success && (
                  <div className="mt-2">
                    <p className="text-red-600 mb-2">Session not found or error occurred.</p>
                    <button
                      onClick={() => {
                        setNewSessionData(prev => ({
                          ...prev,
                          patient_id: user.id === checkResult.userId ? '' : checkResult.userId
                        }));
                      }}
                      className="bg-green-500 hover:bg-green-600 text-white font-bold py-1 px-3 rounded-lg text-sm"
                    >
                      Use this ID for new session
                    </button>
                  </div>
                )}
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
              className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50"
            >
              Create Session
            </button>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4">Your Sessions</h2>
          
          {sessions.length === 0 ? (
            <p className="text-gray-500">No sessions found.</p>
          ) : (
            <div className="space-y-4">
              {sessions.map((session) => (
                <div key={session.id} className="border rounded-lg p-4">
                  <p><strong>Session ID:</strong> {session.id}</p>
                  <p><strong>Counselor ID:</strong> {session.counselor_id}</p>
                  <p><strong>Patient ID:</strong> {session.patient_id}</p>
                  <p><strong>Date:</strong> {new Date(session.session_date).toLocaleDateString()}</p>
                  <p><strong>Status:</strong> {session.status}</p>
                  
                  <div className="mt-4 flex space-x-2">
                    <button
                      onClick={() => setSessionId(session.id)}
                      className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-1 px-3 rounded-lg text-sm"
                    >
                      Check
                    </button>
                    
                    <button
                      onClick={() => fixSession(session.id)}
                      className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-1 px-3 rounded-lg text-sm"
                    >
                      Fix
                    </button>
                    
                    <Link
                      href={`/counseling/session/${session.id}`}
                      className="bg-green-500 hover:bg-green-600 text-white font-bold py-1 px-3 rounded-lg text-sm"
                    >
                      Open
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
