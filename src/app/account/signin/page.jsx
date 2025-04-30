'use client';
import React, { useState } from 'react';
import { useAuth } from '@/utils/useAuth';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import Navbar from '@/components/ui/Navbar';
import { supabase } from '@/utils/supabaseClient';

const SignIn = () => {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const searchParams = useSearchParams();
  const router = useRouter();

  const handleSubmit = async (e) => {
    console.log('handleSubmit called with event:', e ? 'Event exists' : 'No event');

    if (e && e.preventDefault) {
      e.preventDefault();
      console.log('preventDefault called on event');
    }

    setError(null);
    console.log('Sign-in form submitted with email:', email, 'password length:', password.length);

    // Validate inputs before proceeding
    if (!email || !password) {
      console.error('Email or password is empty');
      setError('Email and password are required');
      return;
    }

    try {
      console.log('Calling signIn function with email:', email);

      // Sign in the user
      const user = await signIn(email, password);
      console.log('Sign-in successful, user:', user ? `ID: ${user.id}` : 'No user returned');

      if (!user) {
        throw new Error('No user returned from sign-in');
      }

      // Store a flag in localStorage to indicate successful sign-in
      localStorage.setItem('justSignedIn', 'true');

      // Get the callback URL if specified
      const callbackUrl = searchParams.get('callbackUrl') || searchParams.get('redirect');

      // Check if the user is a counselor
      try {
        console.log('Checking user role for ID:', user.id);
        const { data: profile, error } = await supabase
          .from('user_profiles')
          .select('role, display_name')
          .eq('id', user.id)
          .single();

        console.log('User profile after sign-in:', profile, error ? `Error: ${error.message}` : 'No error');

        if (error) {
          console.error('Error fetching user profile:', error);
          // Continue with default redirection
        } else if (profile) {
          console.log('User role determined:', profile.role);

          // If there's a specific callback URL, it takes precedence
          if (callbackUrl) {
            console.log('Redirecting to callback URL:', callbackUrl);
            window.location.href = callbackUrl;
            return;
          }

          // Otherwise redirect based on role
          if (profile.role === 'counselor') {
            console.log('User is a counselor, redirecting to counselor dashboard');
            window.location.href = '/counselor-dashboard';
            return;
          } else if (profile.role === 'admin') {
            console.log('User is an admin, redirecting to admin dashboard');
            window.location.href = '/admin/dashboard';
            return;
          } else {
            console.log('User is a regular user, redirecting to home page');
            window.location.href = '/home';
            return;
          }
        } else {
          console.log('No profile found, redirecting to home page');
          window.location.href = '/home';
          return;
        }
      } catch (profileError) {
        console.error('Error checking user role:', profileError);
        // Continue with default redirection
      }

      // Default redirection if role check fails or no specific role handling
      if (callbackUrl) {
        console.log('Redirecting to callback URL (default):', callbackUrl);
        window.location.href = callbackUrl;
      } else {
        console.log('No callback URL, redirecting to home (default)');
        window.location.href = '/home';
      }
    } catch (error) {
      console.error('Sign-in error in component:', error);
      setError(error.message || 'Failed to sign in. Please check your credentials.');
    }
  };

  // Add debug functions to help troubleshoot
  const debugSignIn = () => {
    console.log('Debug sign-in clicked');
    // Try to sign in with test credentials
    signIn('test@example.com', 'password123')
      .then(user => {
        console.log('Debug sign-in successful:', user);
        alert('Debug sign-in successful. Check console for details.');
        window.location.href = '/counselor-dashboard';
      })
      .catch(err => {
        console.error('Debug sign-in failed:', err);
        alert('Debug sign-in failed: ' + err.message);
      });
  };

  // Add a direct form submission test
  const testFormSubmission = () => {
    console.log('Testing form submission directly');

    // Set test values for email and password
    setEmail('test@example.com');
    setPassword('password123');

    // Call the handleSubmit function directly with a mock event
    handleSubmit({
      preventDefault: () => console.log('preventDefault called')
    });

    console.log('Form submission test complete');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex flex-col">
      <Navbar />

      <div className="flex-grow flex items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md animate-fade-in">
          <CardHeader>
            <h2 className="text-2xl font-bold text-gray-900 font-heading">Welcome Back</h2>
            <p className="text-gray-600">Sign in to your account to continue</p>
            {/* Add debug buttons that are only visible in development */}
            {process.env.NODE_ENV === 'development' && (
              <div className="flex space-x-2 mt-2">
                <button
                  onClick={debugSignIn}
                  className="text-xs text-gray-400 hover:text-gray-600"
                >
                  Debug Sign-in
                </button>
                <button
                  onClick={testFormSubmission}
                  className="text-xs text-gray-400 hover:text-gray-600"
                >
                  Test Form
                </button>
              </div>
            )}
          </CardHeader>

          <CardContent>
            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-600">
                <p>{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
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
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-medium text-gray-700">Password</label>
                  <Link href="/account/forgot-password" className="text-xs text-primary-600 hover:text-primary-800">
                    Forgot password?
                  </Link>
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                  placeholder="••••••••"
                />
              </div>

              <Button
                type="button" // Changed from submit to button
                variant="primary"
                size="lg"
                fullWidth
                className="mt-6"
                onClick={(e) => {
                  e.preventDefault(); // Prevent default since we're handling it manually
                  console.log('Sign In button clicked manually');

                  // Call handleSubmit directly
                  handleSubmit({
                    preventDefault: () => console.log('preventDefault called in button click')
                  });
                }}
              >
                Sign In
              </Button>

              {/* Add a direct button that bypasses the form for testing */}
              {process.env.NODE_ENV === 'development' && (
                <button
                  type="button"
                  className="mt-2 w-full py-2 px-4 text-sm text-gray-500 hover:text-gray-700"
                  onClick={(e) => {
                    e.preventDefault();
                    console.log('Direct sign-in button clicked');
                    handleSubmit({
                      preventDefault: () => console.log('preventDefault called in direct button')
                    });
                  }}
                >
                  Direct Sign In (Debug)
                </button>
              )}
            </form>
          </CardContent>

          <CardFooter className="text-center border-t border-gray-100 pt-6">
            <p className="text-gray-600">
              Don't have an account?{' '}
              <Link href="/account/signup" className="text-primary-600 hover:text-primary-800 font-medium">
                Create an account
              </Link>
            </p>

            {/* Add a direct link to counselor dashboard for testing */}
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-400 mb-2">Development Testing Links:</p>
                <div className="flex justify-center space-x-4">
                  <button
                    onClick={() => window.location.href = '/counselor-dashboard'}
                    className="text-xs text-blue-400 hover:text-blue-600"
                  >
                    Test Counselor Dashboard
                  </button>
                  <button
                    onClick={() => window.location.href = '/home'}
                    className="text-xs text-green-400 hover:text-green-600"
                  >
                    Test Home
                  </button>
                </div>
              </div>
            )}
          </CardFooter>
        </Card>
      </div>

      <div className="py-4 text-center text-gray-500 text-sm">
        <p>© {new Date().getFullYear()} Mental Health Support. All rights reserved.</p>
      </div>
    </div>
  );
};

export default SignIn;