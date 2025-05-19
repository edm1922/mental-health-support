'use client';
import React from 'react';

/**
 * A simple red cross icon component for Healmate
 * @param {Object} props - Component props
 * @param {string} props.size - Size of the icon (small, medium, large, xlarge)
 * @param {string} props.className - Additional CSS classes
 * @returns {JSX.Element} - RedCross icon component
 */
export default function RedCrossIcon({ 
  size = 'medium', 
  className = '',
}) {
  const sizes = {
    small: { width: 24, height: 24 },
    medium: { width: 32, height: 32 },
    large: { width: 48, height: 48 },
    xlarge: { width: 64, height: 64 }
  };
  
  const { width, height } = sizes[size] || sizes.medium;
  
  return (
    <div className={`red-cross-icon ${className}`} style={{ width, height }}>
      <svg 
        width={width} 
        height={height} 
        viewBox="0 0 24 24" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect x="9" y="3" width="6" height="18" rx="2" fill="#F03E3E" />
        <rect x="3" y="9" width="18" height="6" rx="2" fill="#F03E3E" />
      </svg>
    </div>
  );
}
