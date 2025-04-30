"use client";
import React, { useState, useEffect } from "react";
import { useUser } from "@/utils/useUser";

export default function DebugPage() {
  const { data: user, loading: userLoading, role } = useUser();
  const [apiData, setApiData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDebugData = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/debug-auth");
        const data = await response.json();
        setApiData(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDebugData();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-3xl font-bold mb-6">Auth Debug Page</h1>
        
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">useUser Hook Data</h2>
          {userLoading ? (
            <p>Loading user data...</p>
          ) : (
            <div>
              <p><strong>User ID:</strong> {user?.id || "Not logged in"}</p>
              <p><strong>Email:</strong> {user?.email || "N/A"}</p>
              <p><strong>Role:</strong> {role || user?.role || "N/A"}</p>
              <p><strong>Profile:</strong> {user?.profile ? "Loaded" : "Not loaded"}</p>
              <pre className="bg-gray-100 p-4 rounded mt-4 overflow-auto max-h-60 text-xs">
                {JSON.stringify(user, null, 2)}
              </pre>
            </div>
          )}
        </div>
        
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">API Debug Data</h2>
          {loading ? (
            <p>Loading API data...</p>
          ) : error ? (
            <p className="text-red-500">Error: {error}</p>
          ) : (
            <div>
              <p><strong>Authenticated:</strong> {apiData?.authenticated ? "Yes" : "No"}</p>
              <p><strong>User ID:</strong> {apiData?.userId || "N/A"}</p>
              <p><strong>Email:</strong> {apiData?.email || "N/A"}</p>
              <p><strong>Profile Role:</strong> {apiData?.profile?.role || "N/A"}</p>
              <p><strong>Tables Count:</strong> {apiData?.tables?.length || 0}</p>
              
              <div className="mt-4">
                <h3 className="font-semibold">Database Tables:</h3>
                <ul className="list-disc pl-5 mt-2">
                  {apiData?.tables?.map(table => (
                    <li key={table.table_name}>{table.table_name}</li>
                  ))}
                </ul>
              </div>
              
              <pre className="bg-gray-100 p-4 rounded mt-4 overflow-auto max-h-60 text-xs">
                {JSON.stringify(apiData, null, 2)}
              </pre>
            </div>
          )}
        </div>
        
        <div className="mt-6 flex gap-4">
          <a 
            href="/counselor/dashboard" 
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Go to Counselor Dashboard
          </a>
          <a 
            href="/home" 
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Go to Home
          </a>
        </div>
      </div>
    </div>
  );
}
