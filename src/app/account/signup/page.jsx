'use client';
import React, { useState } from 'react';
import { useAuth } from '@/utils/useAuth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const SignUp = () => {
  const { signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    console.log('Sign-up form submitted with email:', email, 'and display name:', displayName);

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      console.log('Calling signUp function...');
      // Use the signUp function from useAuth
      const result = await signUp(email, password, displayName);
      console.log('Sign up successful:', result);

      setSuccess(true);
      // Redirect after a short delay to show success message
      setTimeout(() => {
        console.log('Redirecting to sign-in page...');
        router.push('/account/signin');
      }, 2000);
    } catch (error) {
      console.error('Sign up error in component:', error);

      // Handle different types of errors with more specific messages
      if (error.message.includes('user profile') || error.message.includes('Database setup required')) {
        // Try to create the tables directly
        try {
          console.log('Attempting to create database tables directly...');
          const response = await fetch('/api/database/create-tables', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {
            console.log('Tables created successfully, retrying signup...');
            // Wait a moment for the tables to be fully created
            await new Promise(resolve => setTimeout(resolve, 1000));
            // Try signup again
            const retryResult = await signUp(email, password, displayName);
            console.log('Retry signup successful:', retryResult);
            setSuccess(true);
            // Redirect after a short delay to show success message
            setTimeout(() => {
              console.log('Redirecting to sign-in page...');
              router.push('/account/signin');
            }, 2000);
            return;
          } else {
            console.error('Failed to create tables:', await response.json());
            setError(
              <>
                Failed to create user profile. Please visit the{' '}
                <a href="/setup/database" className="text-blue-600 underline">
                  database setup page
                </a>{' '}
                to initialize your database.
              </>
            );
          }
        } catch (setupError) {
          console.error('Error setting up database:', setupError);
          setError(
            <>
              Failed to create user profile. Please visit the{' '}
              <a href="/setup/database" className="text-blue-600 underline">
                database setup page
              </a>{' '}
              to initialize your database.
            </>
          );
        }
      } else if (error.message.includes('already registered')) {
        setError('This email is already registered. Please sign in or use a different email.');
      } else if (error.message.includes('password')) {
        setError('Password error: ' + error.message);
      } else {
        setError(error.message || 'An error occurred during sign up');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-6 rounded shadow-md w-96">
        <h2 className="text-2xl font-bold mb-4">Create Account</h2>

        {success ? (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            <p>Account created successfully! Redirecting to sign in...</p>
          </div>
        ) : (
          <>
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                <p>{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700">Display Name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                  className="border rounded w-full py-2 px-3"
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="border rounded w-full py-2 px-3"
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="border rounded w-full py-2 px-3"
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  className="border rounded w-full py-2 px-3"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 text-white rounded py-2 px-4 w-full disabled:opacity-50"
              >
                {loading ? 'Creating Account...' : 'Sign Up'}
              </button>
            </form>

            <div className="mt-4 text-center">
              <p className="text-gray-600">
                Already have an account?{' '}
                <Link href="/account/signin" className="text-blue-600 hover:underline">
                  Sign In
                </Link>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SignUp;
