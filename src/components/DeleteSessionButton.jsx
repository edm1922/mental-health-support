"use client";
import { useState } from 'react';

export default function DeleteSessionButton({ sessionId, onSuccess }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState(null);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this session? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      const response = await fetch('/api/counseling/delete-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId }),
      });

      const data = await response.json();

      if (response.ok) {
        console.log('Session deleted successfully:', data);
        if (onSuccess) {
          onSuccess();
        }
      } else {
        console.error('Failed to delete session:', data);
        setError(data.error || 'Failed to delete session');
      }
    } catch (err) {
      console.error('Error deleting session:', err);
      setError('An unexpected error occurred');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div>
      <button
        onClick={handleDelete}
        disabled={isDeleting}
        className="rounded-lg border border-red-300 bg-white px-4 py-2 text-red-600 hover:bg-red-50 disabled:opacity-50"
      >
        {isDeleting ? 'Deleting...' : 'Delete History'}
      </button>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
