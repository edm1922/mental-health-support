'use client';

import { useState, useEffect } from 'react';

export default function ApiTestPage() {
  const [testResult, setTestResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [signInResult, setSignInResult] = useState(null);
  const [signInLoading, setSignInLoading] = useState(false);
  const [signInError, setSignInError] = useState(null);

  const testApi = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/test');
      const data = await response.json();
      setTestResult(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch');
    } finally {
      setLoading(false);
    }
  };

  const testSignInApi = async () => {
    setSignInLoading(true);
    setSignInError(null);
    try {
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email: 'counselor1@example.com', 
          password: 'counselor' 
        }),
      });
      
      const data = await response.json();
      setSignInResult(data);
    } catch (err) {
      setSignInError(err.message || 'Failed to fetch');
    } finally {
      setSignInLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-md p-6">
        <h1 className="text-2xl font-bold mb-6">API Test Page</h1>
        
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Test API</h2>
          <button
            onClick={testApi}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 mb-4"
            disabled={loading}
          >
            {loading ? 'Testing...' : 'Test API'}
          </button>
          
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
              <p>Error: {error}</p>
            </div>
          )}
          
          {testResult && (
            <div className="bg-gray-50 p-4 rounded-lg overflow-auto">
              <pre className="text-sm">{JSON.stringify(testResult, null, 2)}</pre>
            </div>
          )}
        </div>
        
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Test Sign-In API</h2>
          <button
            onClick={testSignInApi}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 mb-4"
            disabled={signInLoading}
          >
            {signInLoading ? 'Testing...' : 'Test Sign-In API'}
          </button>
          
          {signInError && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
              <p>Error: {signInError}</p>
            </div>
          )}
          
          {signInResult && (
            <div className="bg-gray-50 p-4 rounded-lg overflow-auto">
              <pre className="text-sm">{JSON.stringify(signInResult, null, 2)}</pre>
            </div>
          )}
        </div>
        
        <div className="flex flex-wrap gap-4">
          <a
            href="/"
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Go to Home
          </a>
          
          <a
            href="/account/signin"
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Go to Sign In
          </a>
        </div>
      </div>
    </div>
  );
}
