'use client';
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/utils/useAuth';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/utils/supabaseClient';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/Card';
import { FallbackCard, FallbackCardHeader, FallbackCardContent, FallbackCardFooter } from '@/components/ui/FallbackCard';
import { Button } from '@/components/ui/Button';
import FallbackButton from '@/components/ui/FallbackButton';
import './signup.css';

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
  const searchParams = useSearchParams();



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
        console.log('Redirecting to homepage...');
        router.push('/home');
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
              console.log('Redirecting to homepage...');
              router.push('/home');
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
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex flex-col signup-container">
      <div className="flex-grow flex items-center justify-center px-4 py-12">
        {/* Try to use the Card component first */}
        <div className="hidden sm:block w-full max-w-md">
          <Card className="w-full max-w-md animate-fade-in card">
            <CardHeader className="card-header">
              <h2 className="text-2xl font-bold text-gray-900 font-heading">Create Your Account</h2>
              <p className="text-gray-600">Join our mental health support community</p>
            </CardHeader>

          <CardContent className="card-content">
            {success ? (
              <div className="p-4 rounded-xl bg-accent-50 border border-accent-200 text-accent-700 animate-pulse-slow success-message">
                <p className="font-medium">Account created successfully!</p>
                <p className="text-sm mt-1">Redirecting to homepage...</p>
              </div>
            ) : (
              <>
                {error && (
                  <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 error-message">
                    <p>{error}</p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="form-group">
                    <label className="block text-sm font-medium text-gray-700 mb-1 form-label">Display Name</label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors form-input"
                      placeholder="Your name"
                    />
                  </div>

                  <div className="form-group">
                    <label className="block text-sm font-medium text-gray-700 mb-1 form-label">Email Address</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors form-input"
                      placeholder="you@example.com"
                    />
                  </div>

                  <div className="form-group">
                    <label className="block text-sm font-medium text-gray-700 mb-1 form-label">Password</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors form-input"
                      placeholder="••••••••"
                    />
                    <p className="text-xs text-gray-500 mt-1">Must be at least 6 characters</p>
                  </div>

                  <div className="form-group">
                    <label className="block text-sm font-medium text-gray-700 mb-1 form-label">Confirm Password</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={6}
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors form-input"
                      placeholder="••••••••"
                    />
                  </div>

                  <div className="pt-2">
                    {/* Try to use the Button component first */}
                    <div className="hidden sm:block">
                      <Button
                        type="submit"
                        variant="primary"
                        size="lg"
                        fullWidth
                        loading={loading}
                        disabled={loading}
                        className="btn btn-primary"
                      >
                        {loading ? 'Creating Account...' : 'Create Account'}
                      </Button>
                    </div>

                    {/* Fallback button for mobile or if Button component fails */}
                    <div className="sm:hidden">
                      <FallbackButton
                        type="submit"
                        variant="primary"
                        loading={loading}
                        disabled={loading}
                        className="w-full px-6 py-3 text-base btn btn-primary"
                      >
                        {loading ? 'Creating Account...' : 'Create Account'}
                      </FallbackButton>
                    </div>
                  </div>
                </form>
              </>
            )}
          </CardContent>

          <CardFooter className="text-center border-t border-gray-100 pt-6 card-footer">
            <div className="space-y-4">
              <p className="text-gray-600">
                Already have an account?{' '}
                <Link href="/account/signin" className="text-primary-600 hover:text-primary-800 font-medium link">
                  Sign in
                </Link>
              </p>

              <div className="flex justify-center">
                <Link href="/" className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                  </svg>
                  Go Home
                </Link>
              </div>
            </div>
          </CardFooter>
          </Card>
        </div>

        {/* Fallback card for mobile or if Card component fails */}
        <div className="sm:hidden w-full max-w-md">
          <FallbackCard className="w-full max-w-md animate-fade-in card">
            <FallbackCardHeader className="card-header">
              <h2 className="text-2xl font-bold text-gray-900 font-heading">Create Your Account</h2>
              <p className="text-gray-600">Join our mental health support community</p>
            </FallbackCardHeader>

            <FallbackCardContent className="card-content">
              {success ? (
                <div className="p-4 rounded-xl bg-accent-50 border border-accent-200 text-accent-700 animate-pulse-slow success-message">
                  <p className="font-medium">Account created successfully!</p>
                  <p className="text-sm mt-1">Redirecting to homepage...</p>
                </div>
              ) : (
                <>
                  {error && (
                    <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 error-message">
                      <p>{error}</p>
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="form-group">
                      <label className="block text-sm font-medium text-gray-700 mb-1 form-label">Display Name</label>
                      <input
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors form-input"
                        placeholder="Your name"
                      />
                    </div>

                    <div className="form-group">
                      <label className="block text-sm font-medium text-gray-700 mb-1 form-label">Email Address</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors form-input"
                        placeholder="you@example.com"
                      />
                    </div>

                    <div className="form-group">
                      <label className="block text-sm font-medium text-gray-700 mb-1 form-label">Password</label>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors form-input"
                        placeholder="••••••••"
                      />
                      <p className="text-xs text-gray-500 mt-1">Must be at least 6 characters</p>
                    </div>

                    <div className="form-group">
                      <label className="block text-sm font-medium text-gray-700 mb-1 form-label">Confirm Password</label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        minLength={6}
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors form-input"
                        placeholder="••••••••"
                      />
                    </div>

                    <div className="pt-2">
                      <FallbackButton
                        type="submit"
                        variant="primary"
                        loading={loading}
                        disabled={loading}
                        className="w-full px-6 py-3 text-base btn btn-primary"
                      >
                        {loading ? 'Creating Account...' : 'Create Account'}
                      </FallbackButton>
                    </div>
                  </form>
                </>
              )}
            </FallbackCardContent>

            <FallbackCardFooter className="text-center border-t border-gray-100 pt-6 card-footer">
              <div className="space-y-4">
                <p className="text-gray-600">
                  Already have an account?{' '}
                  <Link href="/account/signin" className="text-primary-600 hover:text-primary-800 font-medium link">
                    Sign in
                  </Link>
                </p>

                <div className="flex justify-center">
                  <Link href="/" className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                    </svg>
                    Go Home
                  </Link>
                </div>
              </div>
            </FallbackCardFooter>
          </FallbackCard>
        </div>
      </div>

      <div className="py-4 text-center text-gray-500 text-sm footer">
        <p>© {new Date().getFullYear()} Healmate. All rights reserved.</p>
      </div>
    </div>
  );
};

export default SignUp;
