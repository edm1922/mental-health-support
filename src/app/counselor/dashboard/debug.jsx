'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabaseClient';

export default function DebugPage() {
  const [sessionInfo, setSessionInfo] = useState(null);
  const [cookies, setCookies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function checkSession() {
      try {
        // Check session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          setError(`Session error: ${sessionError.message}`);
          return;
        }
        
        setSessionInfo(session);
        
        // Get cookies
        const cookieList = document.cookie.split(';').map(cookie => {
          const [name, value] = cookie.trim().split('=');
          return { name, value };
        });
        
        setCookies(cookieList);
      } catch (err) {
        setError(`Unexpected error: ${err.message}`);
      } finally {
        setLoading(false);
      }
    }
    
    checkSession();
  }, []);
  
  const handleManualRedirect = () => {
    window.location.href = '/counselor/dashboard?bypass=true';
  };
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Loading...</h1>
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-md p-6">
        <h1 className="text-2xl font-bold mb-6">Authentication Debug Page</h1>
        
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}
        
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Session Information</h2>
          {sessionInfo ? (
            <div className="bg-gray-50 p-4 rounded-lg overflow-auto">
              <pre className="text-sm">{JSON.stringify(sessionInfo, null, 2)}</pre>
            </div>
          ) : (
            <p className="text-red-600">No active session found</p>
          )}
        </div>
        
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Cookies</h2>
          {cookies.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="py-2 px-4 text-left">Name</th>
                    <th className="py-2 px-4 text-left">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {cookies.map((cookie, index) => (
                    <tr key={index} className="border-t">
                      <td className="py-2 px-4">{cookie.name}</td>
                      <td className="py-2 px-4">{cookie.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-600">No cookies found</p>
          )}
        </div>
        
        <div className="flex flex-wrap gap-4">
          <button
            onClick={handleManualRedirect}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go to Dashboard with Bypass
          </button>
          
          <a
            href="/account/signin"
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Go to Sign In
          </a>
        </div>
      </div>
    </div>
  );
}
