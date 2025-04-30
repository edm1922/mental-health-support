'use client';
import React, { useState } from 'react';

export default function TestPage() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const testCreateProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/test/create-profile');
      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const testCreateTables = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/database/create-tables', {
        method: 'POST'
      });
      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const testCheckTables = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/database/check-tables');
      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Database Test Page</h1>
      
      <div className="flex space-x-4 mb-6">
        <button 
          onClick={testCreateTables}
          className="bg-blue-500 text-white px-4 py-2 rounded"
          disabled={loading}
        >
          Create Tables
        </button>
        
        <button 
          onClick={testCheckTables}
          className="bg-green-500 text-white px-4 py-2 rounded"
          disabled={loading}
        >
          Check Tables
        </button>
        
        <button 
          onClick={testCreateProfile}
          className="bg-purple-500 text-white px-4 py-2 rounded"
          disabled={loading}
        >
          Test Create Profile
        </button>
      </div>
      
      {loading && <p className="text-gray-600">Loading...</p>}
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>{error}</p>
        </div>
      )}
      
      {result && (
        <div className="mt-4">
          <h2 className="text-xl font-semibold mb-2">Result:</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-96">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
