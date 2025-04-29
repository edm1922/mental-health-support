import React, { useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

const SignInFixed = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [debugInfo, setDebugInfo] = useState(null);

  const supabase = createClientComponentClient();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setSuccess(false);
    setDebugInfo(null);

    try {
      console.log('Attempting to sign in with email:', email);

      // Use the Supabase client directly
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Sign-in error:', error);
        setError(error.message || 'Failed to sign in');
        return;
      }

      if (!data?.user || !data?.session) {
        console.error('Sign-in returned no user or session');
        setError('Authentication failed. Please try again.');
        return;
      }

      console.log('Sign-in successful for user:', data.user.id);
      console.log('Session token:', data.session.access_token.substring(0, 10) + '...');

      setSuccess(true);
      setDebugInfo({
        userId: data.user.id,
        email: data.user.email,
        sessionExpires: new Date(data.session.expires_at * 1000).toLocaleString(),
        tokenStart: data.session.access_token.substring(0, 10) + '...'
      });

      // Verify the session was created
      const { data: verifyData } = await supabase.auth.getSession();
      console.log('Session verification:', verifyData.session ? 'Session exists' : 'No session found');

      if (verifyData.session) {
        setDebugInfo(prev => ({
          ...prev,
          sessionVerified: true,
          verifiedUserId: verifyData.session.user.id
        }));
      } else {
        setDebugInfo(prev => ({
          ...prev,
          sessionVerified: false,
          error: 'Session verification failed'
        }));
      }

      // Redirect to the counselor sessions page after a short delay
      setTimeout(() => {
        window.location.href = '/counselor/sessions';
      }, 2000);
    } catch (err) {
      console.error('Sign-in exception:', err);
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <h2 className="text-2xl font-bold mb-6 text-center">Sign In</h2>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
            Sign in successful! Redirecting...
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="your@email.com"
              disabled={loading}
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            className={`w-full py-2 px-4 rounded-md text-white font-medium ${
              loading
                ? 'bg-blue-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
            }`}
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <a href="/account/signup" className="text-blue-600 hover:underline">
                Sign up
              </a>
            </p>
          </div>
        </form>

        {debugInfo && (
          <div className="mt-6 p-4 bg-gray-50 rounded-md border border-gray-200">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Debug Information</h3>
            <pre className="text-xs overflow-auto bg-gray-100 p-2 rounded max-h-40">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>
        )}

        <div className="mt-6 pt-6 border-t border-gray-200">
          <button
            onClick={() => {
              setEmail('test@example.com');
              setPassword('password123');
            }}
            className="w-full py-2 px-4 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            Fill Test Credentials
          </button>

          <div className="mt-4 flex justify-between">
            <a
              href="/auth-test"
              className="text-sm text-blue-600 hover:underline"
            >
              Check Auth Status
            </a>
            <a
              href="/account/signin"
              className="text-sm text-blue-600 hover:underline"
            >
              Original Sign In
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignInFixed;
