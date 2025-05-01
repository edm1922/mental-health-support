'use client';
import React, { useState } from 'react';
import { supabase } from '@/utils/supabaseClient';

export default function TestSignin() {
  const [email, setEmail] = useState('counselor1@example.com');
  const [password, setPassword] = useState('counselor');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const handleSignIn = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      console.log('Signing in with:', email, password);

      // Sign in with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw new Error(error.message);
      }

      console.log('Sign-in successful:', data);
      setResult(data);

      // Store the session in localStorage to ensure it persists across pages
      // This is crucial for the middleware to recognize the authenticated user
      localStorage.setItem('sb-euebogudyyeodzkvhyef-auth-token', JSON.stringify({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: Math.floor(Date.now() / 1000) + data.session.expires_in,
        token_type: 'bearer',
        user: data.user
      }));

      // Wait 3 seconds before redirecting
      setTimeout(() => {
        if (email === 'counselor1@example.com') {
          window.location.href = '/counselor/dashboard';
        } else if (email === 'edronmaguale635@gmail.com') {
          window.location.href = '/admin/dashboard';
        } else {
          window.location.href = '/home';
        }
      }, 3000);
    } catch (err) {
      console.error('Sign-in error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-6">Test Sign-in</h1>

        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>

        <div className="mb-6">
          <label className="block text-gray-700 mb-2">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>

        <button
          onClick={handleSignIn}
          disabled={loading}
          className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 disabled:bg-gray-400"
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>

        {error && (
          <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {result && (
          <div className="mt-4">
            <h2 className="text-lg font-semibold mb-2">Sign-in Result:</h2>
            <div className="p-3 bg-green-100 text-green-700 rounded-lg">
              <p>User ID: {result.user.id}</p>
              <p>Email: {result.user.email}</p>
              <p>Redirecting in 3 seconds...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
