"use client";
import React from "react";
import Link from "next/link";

// Modern UI components with glassmorphism, rounded corners, and subtle animations

export const GlassCard = ({ children, className = "" }) => {
  return (
    <div
      className={`rounded-2xl bg-white backdrop-blur-sm p-6 shadow-xl border border-gray-200 transition-all duration-300 hover:shadow-2xl animate-fadeIn ${className}`}
    >
      {children}
    </div>
  );
};

export const GlassContainer = ({ children, className = "" }) => {
  return (
    <div className={`min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 ${className}`}>
      <div className="mx-auto max-w-4xl">
        {children}
      </div>
    </div>
  );
};

export const BackButton = () => {
  return (
    <Link href="/"
      className="mb-4 inline-flex items-center gap-2 rounded-lg bg-white/80 backdrop-blur-sm px-4 py-2 text-gray-600 shadow-md hover:bg-white/90 transition-all duration-200"
    >
      <svg
        className="h-5 w-5"
        fill="none"
        strokeWidth="2"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M10 19l-7-7m0 0l7-7m-7 7h18"
        />
      </svg>
      Go Back
    </Link>
  );
};

export const ModernButton = ({
  children,
  onClick,
  type = "button",
  disabled = false,
  className = "",
  variant = "primary" // primary, secondary, or outline
}) => {
  const baseClasses = "rounded-lg px-6 py-3 font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 transform hover:scale-[1.02] active:scale-[0.98]";

  const variantClasses = {
    primary: "bg-[#357AFF] text-white hover:bg-[#2E69DE] focus:ring-[#357AFF] disabled:opacity-50",
    secondary: "bg-indigo-100 text-indigo-700 hover:bg-indigo-200 focus:ring-indigo-300 disabled:opacity-50",
    outline: "bg-transparent border border-[#357AFF] text-[#357AFF] hover:bg-blue-50 focus:ring-[#357AFF] disabled:opacity-50"
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

export const ModernInput = ({
  type = "text",
  value,
  onChange,
  placeholder = "",
  required = false,
  className = ""
}) => {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      className={`w-full rounded-lg border border-gray-200 p-3 focus:border-[#357AFF] focus:outline-none focus:ring-1 focus:ring-[#357AFF] transition-all duration-200 ${className}`}
    />
  );
};

export const ModernTextarea = ({
  value,
  onChange,
  placeholder = "",
  rows = 4,
  required = false,
  className = ""
}) => {
  return (
    <textarea
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
      required={required}
      className={`w-full rounded-lg border border-gray-200 p-3 focus:border-[#357AFF] focus:outline-none focus:ring-1 focus:ring-[#357AFF] transition-all duration-200 ${className}`}
    />
  );
};

export const ModernSelect = ({
  value,
  onChange,
  options = [],
  required = false,
  className = ""
}) => {
  return (
    <select
      value={value}
      onChange={onChange}
      required={required}
      className={`w-full rounded-lg border border-gray-200 p-3 focus:border-[#357AFF] focus:outline-none focus:ring-1 focus:ring-[#357AFF] transition-all duration-200 ${className}`}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
};

export const ModernCheckbox = ({
  id,
  checked,
  onChange,
  label = "",
  className = ""
}) => {
  return (
    <div className={`flex items-center ${className}`}>
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="h-5 w-5 rounded border-gray-300 text-[#357AFF] focus:ring-[#357AFF] transition-all duration-200"
      />
      {label && (
        <label htmlFor={id} className="ml-2 block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
    </div>
  );
};

export const ModernHeading = ({
  children,
  level = 1,
  className = ""
}) => {
  const baseClasses = "font-bold text-gray-800";
  const sizeClasses = {
    1: "text-3xl mb-6 animate-slideIn",
    2: "text-2xl mb-4 animate-slideIn",
    3: "text-xl mb-3 animate-slideIn",
    4: "text-lg mb-2 animate-slideIn"
  };

  const Tag = `h${level}`;

  return (
    <Tag className={`${baseClasses} ${sizeClasses[level]} ${className}`}>
      {children}
    </Tag>
  );
};

export const ModernAlert = ({
  children,
  type = "info", // info, success, error, warning
  className = ""
}) => {
  const typeClasses = {
    info: "bg-blue-50 text-blue-700",
    success: "bg-green-50 text-green-600",
    error: "bg-red-50 text-red-500",
    warning: "bg-yellow-50 text-yellow-600"
  };

  return (
    <div className={`rounded-lg p-4 animate-fadeIn ${typeClasses[type]} ${className}`}>
      {children}
    </div>
  );
};

export const ModernLabel = ({
  children,
  htmlFor = "",
  className = ""
}) => {
  return (
    <label
      htmlFor={htmlFor}
      className={`block text-sm font-medium text-gray-700 mb-2 ${className}`}
    >
      {children}
    </label>
  );
};

export const ModernFormGroup = ({
  children,
  className = ""
}) => {
  return (
    <div className={`space-y-2 mb-4 ${className}`}>
      {children}
    </div>
  );
};

export const ModernSpinner = ({
  size = "medium", // small, medium, large
  className = ""
}) => {
  const sizeClasses = {
    small: "h-4 w-4",
    medium: "h-8 w-8",
    large: "h-12 w-12"
  };

  return (
    <div className={`animate-spin rounded-full border-2 border-[#357AFF] border-t-transparent ${sizeClasses[size]} ${className}`}></div>
  );
};

export const ModernCard = ({
  children,
  onClick,
  className = ""
}) => {
  return (
    <div
      onClick={onClick}
      className={`rounded-2xl bg-white p-6 shadow-xl transition-all duration-300 hover:shadow-2xl animate-slideUp ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {children}
    </div>
  );
};

export const ModernEmoji = ({
  emoji,
  isSelected = false,
  onClick,
  className = ""
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-4xl transition-all duration-200 hover:scale-110 ${
        isSelected ? "scale-125" : ""
      } ${className}`}
    >
      {emoji}
    </button>
  );
};
