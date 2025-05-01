'use client';
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/utils/useAuth';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/utils/supabaseClient';

const SignIn = () => {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();



  const handleSubmit = async (e) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }

    setError(null);
    setLoading(true);

    // Validate inputs before proceeding
    if (!email || !password) {
      setError('Email and password are required');
      setLoading(false);
      return;
    }

    try {
      console.log('Signing in with email:', email);

      // Sign in the user
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw new Error(error.message || 'Failed to sign in');
      }

      if (!data.user) {
        throw new Error('No user returned from sign-in');
      }

      console.log('Sign-in successful');

      // Get the user's role from the database
      console.log('Getting user role from database');
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', data.user.id)
        .single();

      // Determine redirect URL based on role
      let redirectUrl = '/home'; // Default redirect

      if (profile && !profileError) {
        console.log('User role from database:', profile.role);

        if (profile.role === 'counselor') {
          // Redirect to the green-themed counselor portal
          redirectUrl = '/counselor/dashboard/direct';
          console.log('User is a counselor, redirecting to green counselor dashboard');
        } else if (profile.role === 'admin') {
          redirectUrl = '/admin/dashboard';
          console.log('User is an admin, redirecting to admin dashboard');
        } else {
          console.log('User is a regular user, redirecting to home page');
        }
      } else {
        console.log('No profile found or error:', profileError);

        // Try to create a profile for the user
        try {
          console.log('Attempting to create a profile for the user');
          const { data: newProfile, error: createError } = await supabase
            .from('user_profiles')
            .upsert({
              id: data.user.id,
              display_name: email.split('@')[0],
              role: 'user', // Default role is user
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .select()
            .single();

          if (createError) {
            console.error('Error creating profile:', createError);
          } else {
            console.log('Profile created successfully:', newProfile);
            // Use the new profile's role for redirection
            if (newProfile.role === 'counselor') {
              // Redirect to the green-themed counselor portal
              redirectUrl = '/counselor/dashboard/direct';
            } else if (newProfile.role === 'admin') {
              redirectUrl = '/admin/dashboard';
            }
          }
        } catch (createError) {
          console.error('Exception creating profile:', createError);
        }
      }

      console.log('Redirecting to:', redirectUrl);

      // Store the authentication in localStorage with the correct key format
      // This is crucial for Supabase to recognize the session
      localStorage.setItem('sb-euebogudyyeodzkvhyef-auth-token', JSON.stringify({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: Math.floor(Date.now() / 1000) + data.session.expires_in,
        token_type: 'bearer',
        user: data.user
      }));

      // Store the role in localStorage for easier access
      localStorage.setItem('userRole', profile?.role || 'user');

      // Wait a moment for the session to be established
      console.log('Waiting for session to be established before redirecting...');
      setTimeout(() => {
        // Use href instead of replace for more reliable navigation
        console.log('Redirecting now to:', redirectUrl);
        window.location.href = redirectUrl;
      }, 1000);
    } catch (error) {
      console.error('Sign-in error:', error);
      setError(error.message || 'Failed to sign in. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex flex-col">
      <div className="flex-grow flex items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md animate-fade-in">
          <CardHeader>
            <h2 className="text-2xl font-bold text-gray-900 font-heading">Welcome Back</h2>
            <p className="text-gray-600">Sign in to your account to continue</p>

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
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                className="mt-6"
                disabled={loading}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>


            </form>
          </CardContent>

          <CardFooter className="text-center border-t border-gray-100 pt-6">
            <div className="space-y-4">
              <p className="text-gray-600">
                Don't have an account?{' '}
                <Link href="/account/signup" className="text-primary-600 hover:text-primary-800 font-medium">
                  Create an account
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

      <div className="py-4 text-center text-gray-500 text-sm">
        <p>© {new Date().getFullYear()} Mental Health Support. All rights reserved.</p>
      </div>
    </div>
  );
};

export default SignIn;