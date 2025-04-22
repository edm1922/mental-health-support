"use client";
import React, { useState, useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import LoadingSpinner from './ui/LoadingSpinner';

const PageTransition = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const handleStart = () => {
      setIsLoading(true);
    };

    const handleComplete = () => {
      setIsLoading(false);
    };

    // Add event listeners for route changes
    document.addEventListener('routeChangeStart', handleStart);
    document.addEventListener('routeChangeComplete', handleComplete);
    document.addEventListener('routeChangeError', handleComplete);

    return () => {
      // Clean up event listeners
      document.removeEventListener('routeChangeStart', handleStart);
      document.removeEventListener('routeChangeComplete', handleComplete);
      document.removeEventListener('routeChangeError', handleComplete);
    };
  }, []);

  // Reset loading state when the route changes
  useEffect(() => {
    setIsLoading(false);
  }, [pathname, searchParams]);

  if (!isLoading) return null;

  return <LoadingSpinner fullScreen color="primary" size="large" text="Loading page..." />;
};

export default PageTransition;
