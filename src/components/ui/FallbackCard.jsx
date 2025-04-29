'use client';
import React from 'react';

export function FallbackCard({ children, className = '' }) {
  return (
    <div className={`rounded-2xl shadow-md bg-white overflow-hidden ${className}`}>
      {children}
    </div>
  );
}

export function FallbackCardHeader({ children, className = '' }) {
  return (
    <div className={`p-6 ${className}`}>
      {children}
    </div>
  );
}

export function FallbackCardContent({ children, className = '' }) {
  return (
    <div className={`px-6 py-4 ${className}`}>
      {children}
    </div>
  );
}

export function FallbackCardFooter({ children, className = '' }) {
  return (
    <div className={`px-6 py-4 border-t border-gray-100 ${className}`}>
      {children}
    </div>
  );
}
