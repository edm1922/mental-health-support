"use client";
import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const SearchBar = ({ className = '', placeholder = 'Search...', onSearch }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const inputRef = useRef(null);
  const searchContainerRef = useRef(null);
  const router = useRouter();

  // Handle click outside to collapse search on mobile
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setIsExpanded(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Focus input when expanded
  useEffect(() => {
    if (isExpanded && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isExpanded]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      if (onSearch) {
        onSearch(searchTerm);
      } else {
        // Default behavior: navigate to search page
        router.push(`/search?q=${encodeURIComponent(searchTerm)}`);
      }
    }
  };

  return (
    <div 
      ref={searchContainerRef}
      className={`relative ${className}`}
    >
      <div className={`flex items-center transition-all duration-300 ${isExpanded ? 'w-full sm:w-64' : 'w-10'}`}>
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex-shrink-0 text-gray-500 hover:text-gray-700 focus:outline-none p-2 rounded-full"
          aria-label={isExpanded ? 'Close search' : 'Open search'}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
          </svg>
        </button>
        
        <form 
          onSubmit={handleSubmit}
          className={`flex-grow transition-all duration-300 ${isExpanded ? 'opacity-100 w-full' : 'opacity-0 w-0 overflow-hidden'}`}
        >
          <input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={placeholder}
            className="w-full bg-gray-100 border-0 rounded-full py-1 px-4 text-sm focus:ring-2 focus:ring-primary-500 focus:bg-white"
            disabled={!isExpanded}
          />
        </form>
      </div>
    </div>
  );
};

export default SearchBar;
