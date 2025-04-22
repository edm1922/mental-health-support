"use client";
import { useState, useEffect } from 'react';
import SimpleProfilePage from "./SimpleProfilePage";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

export default function Page() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading delay
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="large" color="primary" text="Loading your profile..." />
      </div>
    );
  }

  return <SimpleProfilePage />;
}
