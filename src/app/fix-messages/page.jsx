"use client";
import { useState } from 'react';

export default function FixMessagesPage() {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const runFix = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/fix-messages');
      const data = await response.json();
      
      if (!data.success) {
        setError(data.error || 'An unknown error occurred');
      } else {
        setResults(data);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Fix Messages System</h1>
      
      <div className="mb-8">
        <p className="mb-4">
          This page will automatically fix the messages system by:
        </p>
        <ul className="list-disc pl-6 mb-4 space-y-2">
          <li>Creating the <code>get_current_user()</code> function</li>
          <li>Creating the <code>get_messages_for_user()</code> function</li>
          <li>Creating the <code>user_has_messages()</code> function</li>
          <li>Creating the <code>user_has_sessions()</code> function</li>
          <li>Creating the <code>get_all_messages()</code> function</li>
          <li>Adding a policy to allow all users to see all messages (for testing)</li>
        </ul>
        
        <button
          onClick={runFix}
          disabled={loading}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors"
        >
          {loading ? 'Running Fix...' : 'Run Fix'}
        </button>
      </div>
      
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <h2 className="font-semibold mb-2">Error</h2>
          <p>{error}</p>
        </div>
      )}
      
      {results && (
        <div className="space-y-6">
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <h2 className="text-xl font-semibold mb-2 text-green-800">Fix Completed</h2>
            <p className="text-green-700">
              {results.message}
            </p>
          </div>
          
          <div>
            <h2 className="text-xl font-semibold mb-4">SQL Results</h2>
            <div className="space-y-3">
              {results.results.map((result, index) => (
                <div 
                  key={index} 
                  className={`p-3 rounded-lg ${
                    result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                  }`}
                >
                  <div className="flex items-center">
                    <div className={`w-4 h-4 rounded-full mr-2 ${result.success ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <p className="font-mono text-sm truncate">{result.sql}</p>
                  </div>
                  {!result.success && (
                    <p className="mt-2 text-red-600 text-sm">{result.error}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h2 className="text-xl font-semibold mb-4">Next Steps</h2>
            <div className="space-y-3">
              <a 
                href="/test-messages" 
                className="block p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <h3 className="font-semibold text-blue-800">View Test Messages</h3>
                <p className="text-blue-600">See all messages in the system (bypassing RLS)</p>
              </a>
              
              <a 
                href="/debug/user" 
                className="block p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <h3 className="font-semibold text-blue-800">Debug Current User</h3>
                <p className="text-blue-600">Check your current authentication status</p>
              </a>
              
              <a 
                href="/messages" 
                className="block p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <h3 className="font-semibold text-blue-800">Go to Messages</h3>
                <p className="text-blue-600">Try the messages page again</p>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
