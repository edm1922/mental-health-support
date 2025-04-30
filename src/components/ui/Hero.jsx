import React, { useEffect } from 'react';
import { Button } from './Button';

export default function Hero({
  title,
  subtitle,
  image,
  primaryAction,
  secondaryAction,
  wave = true,
  className = '',
  tagline = 'Welcome to Mental Health Support'
}) {
  // Effect for SVG heart animation
  useEffect(() => {
    // This code runs on the client side only
    const handleSvgLoad = () => {
      const img = document.getElementById('hero-illustration');
      if (img && img.complete) {
        // For SVG loaded as an image, we can't directly manipulate its contents
        // The animation is already added in the SVG file itself
        console.log('Hero illustration loaded');
      }
    };

    // Add event listener
    window.addEventListener('load', handleSvgLoad);

    // Also try to run it immediately in case the image is already loaded
    handleSvgLoad();

    // Cleanup
    return () => {
      window.removeEventListener('load', handleSvgLoad);
    };
  }, []);
  return (
    <div className={`relative overflow-hidden bg-gradient-mesh ${className}`}>
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-20">
        <svg className="h-full w-full" viewBox="0 0 800 800" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
              <path d="M 50 0 L 0 0 0 50" fill="none" stroke="white" strokeWidth="1" opacity="0.3" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* Content */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32 pb-48">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="text-center md:text-left mb-8 relative z-10">
            <div className="relative px-4 py-6">
              <div className="absolute inset-0 bg-black/15 blur-xl -z-10 rounded-3xl transform scale-105"></div>
              <p className="text-white/90 font-medium mb-2 animate-fade-in text-shadow-sm">{tagline}</p>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight animate-fade-in text-shadow-lg">
                {title}
              </h1>
              <p className="mt-4 text-xl text-white font-semibold max-w-2xl mx-auto md:mx-0 animate-slide-up text-shadow tracking-wide" style={{ animationDelay: '0.2s' }}>
                {subtitle}
              </p>
            </div>

            {/* Buttons removed as requested */}
          </div>

          {image && (
            <div className="hidden md:block animate-bounce-slow">
              <img
                src={image}
                alt="Hero illustration"
                className="w-full h-auto max-w-md mx-auto"
                id="hero-illustration"
              />
            </div>
          )}


        </div>
      </div>

      {/* Wave divider without visible line */}
      {wave && (
        <div className="absolute bottom-0 left-0 right-0">
          {/* Removed shadow overlay that was causing the visible line */}

          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" className="w-full h-auto relative z-0">
            <defs>
              <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                <feDropShadow dx="0" dy="-3" stdDeviation="2" floodColor="#000" floodOpacity="0.08" />
              </filter>
            </defs>
            <path
              fill="#ffffff"
              fillOpacity="1"
              filter="url(#shadow)"
              d="M0,192L60,197.3C120,203,240,213,360,208C480,203,600,181,720,181.3C840,181,960,203,1080,208C1200,213,1320,203,1380,197.3L1440,192L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z"
            ></path>
          </svg>
        </div>
      )}
    </div>
  );
}
