'use client';
import React, { useState } from 'react';
import { useAuth } from '@/utils/useAuth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import Navbar from '@/components/ui/Navbar';

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
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex flex-col">
      <Navbar />

      <div className="flex-grow flex items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md animate-fade-in">
          <CardHeader>
            <h2 className="text-2xl font-bold text-gray-900 font-heading">Create Your Account</h2>
            <p className="text-gray-600">Join our mental health support community</p>
          </CardHeader>

          <CardContent>
            {success ? (
              <div className="p-4 rounded-xl bg-accent-50 border border-accent-200 text-accent-700 animate-pulse-slow">
                <p className="font-medium">Account created successfully!</p>
                <p className="text-sm mt-1">Redirecting to sign in page...</p>
              </div>
            ) : (
              <>
                {error && (
                  <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-600">
                    <p>{error}</p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                      placeholder="Your name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                      placeholder="you@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                      placeholder="••••••••"
                    />
                    <p className="text-xs text-gray-500 mt-1">Must be at least 6 characters</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={6}
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                      placeholder="••••••••"
                    />
                  </div>

                  <div className="pt-2">
                    <Button
                      type="submit"
                      variant="primary"
                      size="lg"
                      fullWidth
                      loading={loading}
                      disabled={loading}
                    >
                      {loading ? 'Creating Account...' : 'Create Account'}
                    </Button>
                  </div>
                </form>
              </>
            )}
          </CardContent>

          <CardFooter className="text-center border-t border-gray-100 pt-6">
            <p className="text-gray-600">
              Already have an account?{' '}
              <Link href="/account/signin" className="text-primary-600 hover:text-primary-800 font-medium">
                Sign in
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>

      <div className="py-4 text-center text-gray-500 text-sm">
        <p>© {new Date().getFullYear()} Mental Health Support. All rights reserved.</p>
      </div>
    </div>
  );
};

export default SignUp;
