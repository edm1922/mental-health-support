"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DisableRLSPage() {
  const [status, setStatus] = useState('Disabling RLS...');
  const router = useRouter();
  
  useEffect(() => {
    const disableRLS = async () => {
      try {
        const response = await fetch('/api/disable-all-rls');
        const data = await response.json();
        
        if (response.ok) {
          setStatus('RLS disabled successfully! Redirecting...');
          
          // Wait a moment before redirecting
          setTimeout(() => {
            router.push('/counseling/sessions');
          }, 2000);
        } else {
          setStatus(`Error: ${data.error || 'Unknown error'}`);
        }
      } catch (err) {
        console.error('Error disabling RLS:', err);
        setStatus(`Error: ${err.message}`);
      }
    };
    
    disableRLS();
  }, [router]);
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-md p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold text-center mb-6">Disabling RLS</h1>
        
        <div className="flex flex-col items-center">
          {status === 'Disabling RLS...' || status === 'RLS disabled successfully! Redirecting...' ? (
            <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full mb-4"></div>
          ) : (
            <div className="text-red-500 text-5xl mb-4">⚠️</div>
          )}
          
          <p className="text-center text-lg">{status}</p>
          
          {status.startsWith('Error') && (
            <button
              onClick={() => router.push('/counseling/sessions')}
              className="mt-6 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg"
            >
              Return to Sessions
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
