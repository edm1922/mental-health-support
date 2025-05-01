'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function SigninRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Get all search parameters
    const params = new URLSearchParams();
    for (const [key, value] of searchParams.entries()) {
      // If the redirect parameter is for the counselor area, make sure it's the full path
      if (key === 'redirect' && value === '/counselor') {
        params.append(key, '/counselor/dashboard');
      } else {
        params.append(key, value);
      }
    }

    // Create the redirect URL
    const redirectUrl = `/account/signin${params.toString() ? `?${params.toString()}` : ''}`;

    // Redirect to the correct path
    console.log('Redirecting from /signin to:', redirectUrl);
    router.replace(redirectUrl);
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Redirecting...</h1>
        <p className="text-gray-600">Please wait while we redirect you to the sign-in page.</p>
      </div>
    </div>
  );
}
