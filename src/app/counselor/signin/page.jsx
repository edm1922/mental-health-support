'use client';
import React, { useState } from 'react';
import { useAuth } from '@/utils/useAuth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import Navbar from '@/components/ui/Navbar';

const CounselorSignIn = () => {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    console.log('Counselor sign-in form submitted with email:', email);

    try {
      console.log('Calling signIn function...');
      const user = await signIn(email, password);
      console.log('Sign-in successful, redirecting to counselor application...');
      
      // Use window.location for a hard redirect to the counselor application page
      window.location.href = '/counselor/apply';
    } catch (error) {
      console.error('Sign-in error in component:', error);
      setError(error.message || 'Failed to sign in. Please check your credentials.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex flex-col">
      <Navbar />

      <div className="flex-grow flex items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md animate-fade-in">
          <CardHeader>
            <h2 className="text-2xl font-bold text-gray-900 font-heading">Sign In to Apply as a Counselor</h2>
            <p className="text-gray-600">Sign in to your account to continue with your counselor application</p>
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
              >
                Sign In & Continue to Application
              </Button>
            </form>
          </CardContent>

          <CardFooter className="text-center border-t border-gray-100 pt-6">
            <p className="text-gray-600">
              Don't have an account?{' '}
              <Link href="/account/signup?redirect=/counselor/apply" className="text-primary-600 hover:text-primary-800 font-medium">
                Create an account
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

export default CounselorSignIn;
