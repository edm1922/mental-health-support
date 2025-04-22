"use client";
import { useState } from 'react';
import { supabase } from '@/utils/supabaseClient';

export default function RunSQLPage() {
  const [sql, setSql] = useState(`
-- Enable RLS on session_messages table
ALTER TABLE public.session_messages ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to view their own messages
DROP POLICY IF EXISTS "Users can view their own messages" ON public.session_messages;
CREATE POLICY "Users can view their own messages"
ON public.session_messages
FOR SELECT
USING (
  sender_id::text = auth.uid()::text 
  OR recipient_id::text = auth.uid()::text
  OR EXISTS (
    SELECT 1 
    FROM counseling_sessions 
    WHERE 
      id = session_id 
      AND (counselor_id::text = auth.uid()::text OR patient_id::text = auth.uid()::text)
  )
);

-- Create policy to allow users to insert messages
DROP POLICY IF EXISTS "Users can insert messages" ON public.session_messages;
CREATE POLICY "Users can insert messages"
ON public.session_messages
FOR INSERT
WITH CHECK (
  sender_id::text = auth.uid()::text
  OR EXISTS (
    SELECT 1 
    FROM counseling_sessions 
    WHERE 
      id = session_id 
      AND (counselor_id::text = auth.uid()::text OR patient_id::text = auth.uid()::text)
  )
);

-- Create policy to allow users to update their own messages
DROP POLICY IF EXISTS "Users can update their own messages" ON public.session_messages;
CREATE POLICY "Users can update their own messages"
ON public.session_messages
FOR UPDATE
USING (
  sender_id::text = auth.uid()::text
  OR EXISTS (
    SELECT 1 
    FROM counseling_sessions 
    WHERE 
      id = session_id 
      AND (counselor_id::text = auth.uid()::text OR patient_id::text = auth.uid()::text)
  )
);

-- Create policy to allow users to delete their own messages
DROP POLICY IF EXISTS "Users can delete their own messages" ON public.session_messages;
CREATE POLICY "Users can delete their own messages"
ON public.session_messages
FOR DELETE
USING (
  sender_id::text = auth.uid()::text
  OR EXISTS (
    SELECT 1 
    FROM counseling_sessions 
    WHERE 
      id = session_id 
      AND (counselor_id::text = auth.uid()::text OR patient_id::text = auth.uid()::text)
  )
);

-- Create a simpler policy for testing if needed
-- This allows any authenticated user to see all messages
DROP POLICY IF EXISTS "Authenticated users can view all messages" ON public.session_messages;
CREATE POLICY "Authenticated users can view all messages"
ON public.session_messages
FOR SELECT
USING (auth.role() = 'authenticated');
  `);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const runSQL = async () => {
    try {
      setLoading(true);
      setError(null);
      setResult(null);

      // Execute the SQL using the exec_sql RPC function
      const { data, error } = await supabase.rpc('exec_sql', { sql });

      if (error) {
        console.error('Error executing SQL:', error);
        setError(error.message);
        return;
      }

      setResult(data);
    } catch (err) {
      console.error('Error running SQL:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Run SQL</h1>
        
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="mb-4">
            <label htmlFor="sql" className="block text-sm font-medium text-gray-700 mb-2">
              SQL to Execute
            </label>
            <textarea
              id="sql"
              value={sql}
              onChange={(e) => setSql(e.target.value)}
              className="w-full h-96 px-3 py-2 text-gray-700 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            />
          </div>
          
          <button
            onClick={runSQL}
            disabled={loading}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50"
          >
            {loading ? 'Running...' : 'Run SQL'}
          </button>
        </div>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            <h2 className="text-lg font-semibold mb-2">Error</h2>
            <pre className="whitespace-pre-wrap text-sm">{error}</pre>
          </div>
        )}
        
        {result && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            <h2 className="text-lg font-semibold mb-2">Result</h2>
            <pre className="whitespace-pre-wrap text-sm">{JSON.stringify(result, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
}
