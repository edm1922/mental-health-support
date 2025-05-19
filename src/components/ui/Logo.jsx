'use client';
import React from 'react';
import Link from 'next/link';
import RedCrossIcon from './RedCrossIcon';

/**
 * Logo component for Healmate
 * @param {Object} props - Component props
 * @param {string} props.size - Size of the logo (small, medium, large, xlarge)
 * @param {string} props.className - Additional CSS classes
 * @param {boolean} props.linkToHome - Whether to wrap the logo in a link to home
 * @param {string} props.linkClassName - CSS classes for the link wrapper
 * @param {boolean} props.showText - Whether to show the text "Healmate" next to the icon
 * @param {string} props.textClassName - Additional CSS classes for the text
 * @returns {JSX.Element} - Logo component
 */
export default function Logo({
  size = 'medium',
  className = '',
  linkToHome = false,
  linkClassName = '',
  showText = false,
  textClassName = ''
}) {
  const logoElement = (
    <div className={`logo-container flex items-center gap-2 ${className}`}>
      <RedCrossIcon size={size} />
      {showText && (
        <span className={`font-bold ${textClassName}`}>Healmate</span>
      )}
    </div>
  );

  // If linkToHome is true, wrap the logo in a link to the home page
  if (linkToHome) {
    return (
      <Link href="/home" className={linkClassName}>
        {logoElement}
      </Link>
    );
  }

  return logoElement;
}
