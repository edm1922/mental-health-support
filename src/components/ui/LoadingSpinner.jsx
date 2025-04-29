"use client";
import React from 'react';

const LoadingSpinner = ({ 
  size = 'medium', 
  color = 'primary', 
  text = 'Loading...', 
  showText = true,
  fullScreen = false,
  className = ''
}) => {
  // Size classes
  const sizeClasses = {
    small: 'h-6 w-6 border-2',
    medium: 'h-12 w-12 border-4',
    large: 'h-16 w-16 border-4',
    xl: 'h-24 w-24 border-4'
  };

  // Color classes
  const colorClasses = {
    primary: 'border-primary-600 border-t-transparent',
    blue: 'border-blue-600 border-t-transparent',
    green: 'border-green-600 border-t-transparent',
    red: 'border-red-600 border-t-transparent',
    yellow: 'border-yellow-600 border-t-transparent',
    purple: 'border-purple-600 border-t-transparent',
    indigo: 'border-indigo-600 border-t-transparent',
    gray: 'border-gray-600 border-t-transparent'
  };

  // Text color classes
  const textColorClasses = {
    primary: 'text-primary-600',
    blue: 'text-blue-600',
    green: 'text-green-600',
    red: 'text-red-600',
    yellow: 'text-yellow-600',
    purple: 'text-purple-600',
    indigo: 'text-indigo-600',
    gray: 'text-gray-600'
  };

  const spinnerClasses = `rounded-full animate-spin ${sizeClasses[size]} ${colorClasses[color]}`;
  const textClasses = `mt-4 font-medium ${textColorClasses[color]}`;

  // If fullScreen is true, center the spinner in the viewport
  if (fullScreen) {
    return (
      <div className={`fixed inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-50 ${className}`}>
        <div className="text-center">
          <div className={spinnerClasses}></div>
          {showText && <p className={textClasses}>{text}</p>}
        </div>
      </div>
    );
  }

  // Regular spinner
  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className={spinnerClasses}></div>
      {showText && <p className={textClasses}>{text}</p>}
    </div>
  );
};

export default LoadingSpinner;
