"use client";

import React, { useState } from 'react';
import { supabase } from '@/utils/supabaseClient';

export default function AuthDirect() {
  const [email, setEmail] = useState('counselor1@example.com');
  const [password, setPassword] = useState('counselor');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [logs, setLogs] = useState([]);

  const addLog = (message) => {
    setLogs(prev => [...prev, `${new Date().toISOString().split('T')[1].split('.')[0]} - ${message}`]);
    console.log(message);
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    setLogs([]);
    setLoading(true);

    try {
      addLog(`Attempting to sign in with email: ${email}`);
      
      // Sign in with email and password
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        addLog(`Sign-in error: ${error.message}`);
        setError(error.message);
        setLoading(false);
        return;
      }
      
      addLog(`Sign-in successful for user: ${data.user.id}`);
      
      // Get user profile to determine role
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('role, display_name')
        .eq('id', data.user.id)
        .single();
      
      if (profileError) {
        addLog(`Error fetching profile: ${profileError.message}`);
        setError(profileError.message);
        setLoading(false);
        return;
      }
      
      addLog(`User profile: ${JSON.stringify(profile)}`);
      
      // Determine redirect URL based on role
      let redirectUrl = '/home';
      
      if (profile.role === 'counselor') {
        redirectUrl = '/counselor/dashboard';
      } else if (profile.role === 'admin') {
        redirectUrl = '/admin/dashboard';
      }
      
      addLog(`User role: ${profile.role}`);
      addLog(`Redirect URL should be: ${redirectUrl}`);
      
      // Check if the session is valid
      const { data: sessionData } = await supabase.auth.getSession();
      addLog(`Session valid: ${!!sessionData.session}`);
      
      setResult({
        user: data.user,
        profile,
        redirectUrl,
        sessionValid: !!sessionData.session
      });
      
      // Wait a moment for the session to be fully established
      addLog('Waiting 2 seconds for session to be established...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Redirect to the appropriate dashboard
      addLog(`Redirecting to: ${redirectUrl}`);
      window.location.href = redirectUrl;
    } catch (err) {
      addLog(`Error: ${err.message}`);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-md p-6">
        <h1 className="text-2xl font-bold mb-6">Direct Authentication Test</h1>
        
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-xl font-semibold mb-4">Sign In</h2>
            
            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="you@example.com"
                  disabled={loading}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="••••••••"
                  disabled={loading}
                />
              </div>
              
              <button
                type="submit"
                className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                disabled={loading}
              >
                {loading ? 'Signing in...' : 'Sign In and Redirect'}
              </button>
            </form>
            
            {result && (
              <div className="mt-6 bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium mb-2">Result:</h3>
                <pre className="text-xs overflow-auto p-2 bg-gray-100 rounded">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            )}
          </div>
          
          <div>
            <h2 className="text-xl font-semibold mb-4">Logs</h2>
            <div className="bg-gray-100 p-4 rounded-lg h-80 overflow-auto">
              {logs.length === 0 ? (
                <p className="text-gray-500">No logs yet</p>
              ) : (
                <div className="space-y-1 font-mono text-sm">
                  {logs.map((log, index) => (
                    <div key={index} className="border-b border-gray-200 pb-1">
                      {log}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="mt-6 space-y-2">
              <h3 className="font-medium mb-2">Quick Links:</h3>
              <a 
                href="/home" 
                className="block px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 text-center"
              >
                Home
              </a>
              <a 
                href="/counselor/dashboard" 
                className="block px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 text-center"
              >
                Counselor Dashboard
              </a>
              <a 
                href="/admin/dashboard" 
                className="block px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 text-center"
              >
                Admin Dashboard
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
