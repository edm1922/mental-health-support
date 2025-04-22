"use client";
import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Link from 'next/link';

export default function FixSpecificSessionPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sessionId, setSessionId] = useState('');
  const [result, setResult] = useState(null);
  
  const supabase = createClientComponentClient();
  
  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error) {
          console.error('Error getting user:', error);
          setError(error.message);
          return;
        }
        
        setUser(user);
      } catch (err) {
        console.error('Error in getUser:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    getUser();
  }, [supabase]);
  
  const fixSession = async () => {
    try {
      setLoading(true);
      setError(null);
      setResult(null);
      
      if (!sessionId) {
        setError('Please enter a session ID');
        return;
      }
      
      const response = await fetch(`/api/fix-session?id=${sessionId}`);
      const data = await response.json();
      
      setResult(data);
      
      if (data.success) {
        alert(`Success: ${data.message}`);
      } else {
        alert(`Error: ${data.error}`);
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
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Fix Specific Session</h1>
        
        <div className="mb-6 flex flex-wrap gap-4">
          <Link
            href="/counseling/sessions"
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg"
          >
            Back to Sessions
          </Link>
          
          <Link
            href="/fix-session"
            className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg"
          >
            Session Manager
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
        
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Fix Session</h2>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Session ID
            </label>
            <input
              type="text"
              value={sessionId}
              onChange={(e) => setSessionId(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="Enter the session ID from the error message"
            />
          </div>
          
          <div className="flex space-x-4">
            <button
              onClick={fixSession}
              disabled={loading}
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50"
            >
              Fix Session
            </button>
            
            <button
              onClick={async () => {
                try {
                  setLoading(true);
                  
                  // Disable RLS on counseling_sessions table
                  const { error } = await supabase.rpc('exec_sql', { 
                    sql: `ALTER TABLE public.counseling_sessions DISABLE ROW LEVEL SECURITY;`
                  });
                  
                  if (error) {
                    console.error('Error disabling RLS:', error);
                    setError(error.message);
                  } else {
                    alert('RLS disabled successfully on counseling_sessions table');
                  }
                } catch (err) {
                  console.error('Error disabling RLS:', err);
                  setError(err.message);
                } finally {
                  setLoading(false);
                }
              }}
              disabled={loading}
              className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50"
            >
              Disable RLS on Sessions
            </button>
          </div>
        </div>
        
        {result && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-lg font-semibold mb-4">Result</h2>
            <pre className="bg-gray-100 p-4 rounded-lg overflow-auto max-h-96 text-sm">
              {JSON.stringify(result, null, 2)}
            </pre>
            
            {result.success && result.session && (
              <div className="mt-4">
                <Link
                  href={`/counseling/session/${result.session.id}`}
                  className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg"
                >
                  Open Session
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
