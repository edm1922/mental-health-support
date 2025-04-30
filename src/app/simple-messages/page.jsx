"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function SimpleMessagesPage() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [authStatus, setAuthStatus] = useState('checking');
  const router = useRouter();

  useEffect(() => {
    async function fetchMessages() {
      try {
        setLoading(true);
        setError(null);

        // First, fix RLS policies if needed
        await fetch('/api/auth/fix-rls');

        const response = await fetch('/api/messages/get-messages');
        const data = await response.json();

        if (!data.success) {
          if (data.error === 'Authentication required') {
            setAuthStatus('unauthenticated');
          } else {
            setError(data.error);
          }
          return;
        }

        setAuthStatus('authenticated');
        setMessages(data.messages || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchMessages();
  }, []);

  const handleSignIn = () => {
    router.push('/account/signin?redirect=/simple-messages');
  };

  if (authStatus === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4 flex flex-col items-center justify-center">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">Sign In Required</h1>
          <p className="text-gray-600 mb-6">Please sign in to view your messages</p>
          <button
            onClick={handleSignIn}
            className="w-full rounded-lg bg-blue-500 px-4 py-3 text-white hover:bg-blue-600 transition-colors"
          >
            Sign In
          </button>
          <Link
            href="/"
            className="mt-4 inline-block text-gray-500 hover:text-gray-700"
          >
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/home"
            className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-gray-600 shadow-md hover:bg-gray-50"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              strokeWidth="2"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back to Home
          </Link>

          <Link
            href="/fix-auth"
            className="rounded-lg bg-green-500 px-4 py-2 text-white hover:bg-green-600"
          >
            Fix Authentication
          </Link>
        </div>

        <div className="mb-8 rounded-2xl bg-white p-6 shadow-xl">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">
            Your Messages (Simple View)
          </h1>

          {loading && (
            <div className="flex justify-center py-8">
              <div className="animate-spin h-8 w-8 rounded-full border-t-2 border-b-2 border-blue-500"></div>
            </div>
          )}

          {error && (
            <div className="rounded-lg bg-red-50 p-4 text-red-700 mb-6">
              <p className="font-medium">Error:</p>
              <p>{error}</p>
              <div className="mt-4">
                <button
                  onClick={() => window.location.reload()}
                  className="rounded-lg bg-red-100 px-4 py-2 text-red-700 hover:bg-red-200"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}

          {!loading && !error && messages.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">No messages found</p>
              <Link
                href="/fix-auth"
                className="mt-4 inline-block rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
              >
                Fix Authentication
              </Link>
            </div>
          )}

          {messages.length > 0 && (
            <div className="space-y-4">
              {messages.map(message => (
                <div
                  key={message.id}
                  className="rounded-lg border border-gray-200 p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="font-medium text-gray-800">
                        {message.sender_id === message.recipient_id ? 'Test Message' : 'Message'}
                      </span>
                      {!message.is_read && (
                        <span className="ml-2 inline-block rounded-full bg-red-500 w-2 h-2"></span>
                      )}
                    </div>
                    <span className="text-sm text-gray-500">
                      {new Date(message.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-gray-700">{message.message}</p>
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 pt-6 border-t border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Troubleshooting</h2>
            <div className="space-y-3">
              <Link
                href="/fix-auth"
                className="block p-3 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <h3 className="font-medium text-blue-800">Fix Authentication</h3>
                <p className="text-blue-600 text-sm">Create user profile and test messages</p>
              </Link>

              <Link
                href="/messages"
                className="block p-3 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <h3 className="font-medium text-blue-800">Full Messages Interface</h3>
                <p className="text-blue-600 text-sm">Try the complete messaging interface</p>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
