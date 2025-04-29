"use client";
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import the AutoAuthFix component with no SSR
// This ensures it only runs on the client side
const AutoAuthFix = dynamic(() => import('./AutoAuthFix'), { ssr: false });

export default function AutoAuthFixWrapper() {
  // Use state to track if we're on the client
  const [isClient, setIsClient] = useState(false);

  // Use useEffect to set isClient to true after mount
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Only render the component when we're on the client
  if (!isClient) {
    return null;
  }

  return <AutoAuthFix />;
}
