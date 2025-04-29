"use client";
import { useState, useEffect } from 'react';

export default function DebugUserPage() {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    async function fetchUserData() {
      try {
        setLoading(true);
        const response = await fetch('/api/debug/user');
        const data = await response.json();
        
        if (data.error) {
          setError(data.error);
        } else {
          setUserData(data);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    
    fetchUserData();
  }, []);
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Debug User</h1>
      
      {loading && <p>Loading user data...</p>}
      
      {error && <p className="text-red-500">Error: {error}</p>}
      
      {userData && (
        <div className="space-y-6">
          <div className="border p-4 rounded-lg">
            <h2 className="text-xl font-semibold mb-2">Current User</h2>
            <pre className="bg-gray-100 p-4 rounded overflow-auto">
              {JSON.stringify(userData.currentUser, null, 2)}
            </pre>
          </div>
          
          <div className="border p-4 rounded-lg">
            <h2 className="text-xl font-semibold mb-2">auth.uid()</h2>
            <pre className="bg-gray-100 p-4 rounded overflow-auto">
              {JSON.stringify(userData.uid, null, 2)}
            </pre>
            {userData.uidError && (
              <p className="text-red-500 mt-2">Error: {userData.uidError}</p>
            )}
          </div>
          
          <div className="border p-4 rounded-lg">
            <h2 className="text-xl font-semibold mb-2">User Profiles</h2>
            <pre className="bg-gray-100 p-4 rounded overflow-auto">
              {JSON.stringify(userData.profiles, null, 2)}
            </pre>
            {userData.profilesError && (
              <p className="text-red-500 mt-2">Error: {userData.profilesError}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
