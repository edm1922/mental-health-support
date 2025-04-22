"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function MessagesPage() {
  const router = useRouter();

  // Redirect to the counseling sessions page
  useEffect(() => {
    router.replace('/counseling/sessions');
  }, [router]);

  // Return a loading state while redirecting
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
      <div className="animate-spin h-12 w-12 rounded-full border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );


}
