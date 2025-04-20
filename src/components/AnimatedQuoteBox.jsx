"use client";
import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/utils/supabaseClient";
import { GlassCard, ModernButton } from "@/components/ui/ModernUI";

const variants = {
  enter: (direction) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
    scale: 0.9,
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: "easeOut",
    },
  },
  exit: (direction) => ({
    x: direction < 0 ? 300 : -300,
    opacity: 0,
    scale: 0.9,
    transition: {
      duration: 0.5,
      ease: "easeIn",
    },
  }),
};

export default function AnimatedQuoteBox({
  autoRotate = true,
  rotationInterval = 10000,
  showControls = true,
  maxSavedQuotes = 5,
  className = "",
}) {
  const [quotes, setQuotes] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [savedQuotes, setSavedQuotes] = useState([]);
  const [isSaved, setIsSaved] = useState(false);
  const autoRotateTimerRef = useRef(null);

  // Load quotes from the database
  useEffect(() => {
    async function fetchQuotes() {
      try {
        setLoading(true);
        setError(null);

        const { data, error } = await supabase
          .from("inspirational_quotes")
          .select("id, quote, author")
          .order("id");

        if (error) {
          throw new Error(error.message);
        }

        if (data && data.length > 0) {
          setQuotes(data);
          // Load saved quotes from localStorage
          const saved = JSON.parse(localStorage.getItem("savedQuotes") || "[]");
          setSavedQuotes(saved);
          
          // Check if current quote is saved
          if (saved.some(q => q.id === data[currentIndex].id)) {
            setIsSaved(true);
          }
        } else {
          setQuotes([
            { 
              id: 1, 
              quote: "Your mental health is a priority. Your happiness is essential.", 
              author: "Unknown" 
            }
          ]);
        }
      } catch (err) {
        console.error("Error fetching quotes:", err);
        setError("Failed to load quotes");
        // Fallback quotes
        setQuotes([
          { 
            id: 1, 
            quote: "Your mental health is a priority. Your happiness is essential.", 
            author: "Unknown" 
          }
        ]);
      } finally {
        setLoading(false);
      }
    }

    fetchQuotes();
  }, []);

  // Auto-rotate quotes
  useEffect(() => {
    if (autoRotate && quotes.length > 1 && !loading) {
      autoRotateTimerRef.current = setInterval(() => {
        nextQuote();
      }, rotationInterval);
    }

    return () => {
      if (autoRotateTimerRef.current) {
        clearInterval(autoRotateTimerRef.current);
      }
    };
  }, [autoRotate, quotes, loading, currentIndex]);

  // Check if current quote is saved whenever currentIndex changes
  useEffect(() => {
    if (quotes.length > 0) {
      const currentQuote = quotes[currentIndex];
      setIsSaved(savedQuotes.some(q => q.id === currentQuote.id));
    }
  }, [currentIndex, quotes, savedQuotes]);

  const nextQuote = () => {
    setDirection(1);
    setCurrentIndex((prevIndex) => (prevIndex + 1) % quotes.length);
  };

  const prevQuote = () => {
    setDirection(-1);
    setCurrentIndex((prevIndex) => (prevIndex - 1 + quotes.length) % quotes.length);
  };

  const shuffleQuote = () => {
    if (quotes.length <= 1) return;
    
    let newIndex;
    do {
      newIndex = Math.floor(Math.random() * quotes.length);
    } while (newIndex === currentIndex);
    
    setDirection(Math.random() > 0.5 ? 1 : -1);
    setCurrentIndex(newIndex);
  };

  const saveQuote = () => {
    if (quotes.length === 0) return;
    
    const currentQuote = quotes[currentIndex];
    
    // If already saved, remove it
    if (isSaved) {
      const newSavedQuotes = savedQuotes.filter(q => q.id !== currentQuote.id);
      setSavedQuotes(newSavedQuotes);
      localStorage.setItem("savedQuotes", JSON.stringify(newSavedQuotes));
      setIsSaved(false);
    } else {
      // Add to saved quotes, maintaining max limit
      const newSavedQuotes = [...savedQuotes, currentQuote];
      if (newSavedQuotes.length > maxSavedQuotes) {
        newSavedQuotes.shift(); // Remove oldest
      }
      setSavedQuotes(newSavedQuotes);
      localStorage.setItem("savedQuotes", JSON.stringify(newSavedQuotes));
      setIsSaved(true);
    }
  };

  // If loading or no quotes, show placeholder
  if (loading) {
    return (
      <GlassCard className={`flex items-center justify-center p-8 ${className}`}>
        <div className="animate-pulse flex flex-col items-center space-y-4 w-full">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          <div className="h-4 bg-gray-200 rounded w-1/4 mt-4"></div>
        </div>
      </GlassCard>
    );
  }

  if (error || quotes.length === 0) {
    return (
      <GlassCard className={`p-8 ${className}`}>
        <p className="text-center text-gray-600">
          {error || "No inspirational quotes available at the moment."}
        </p>
      </GlassCard>
    );
  }

  const currentQuote = quotes[currentIndex];

  return (
    <GlassCard 
      className={`overflow-hidden relative ${className}`}
      onClick={autoRotate ? nextQuote : undefined}
    >
      <div className={`p-8 ${autoRotate ? 'cursor-pointer' : ''}`}>
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={currentIndex}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            className="flex flex-col items-center text-center min-h-[180px] justify-center"
          >
            <motion.blockquote
              className="text-xl md:text-2xl font-medium text-gray-700 mb-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              "{currentQuote.quote}"
            </motion.blockquote>
            
            <motion.cite
              className="text-sm md:text-base text-gray-500 font-medium"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              — {currentQuote.author}
            </motion.cite>
          </motion.div>
        </AnimatePresence>
      </div>

      {showControls && (
        <motion.div 
          className="flex justify-center space-x-2 p-4 border-t border-gray-100"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <ModernButton
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              prevQuote();
            }}
            className="!px-3 !py-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </ModernButton>
          
          <ModernButton
            variant={isSaved ? "primary" : "outline"}
            onClick={(e) => {
              e.stopPropagation();
              saveQuote();
            }}
            className="!px-3 !py-2"
          >
            {isSaved ? (
              <span className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                </svg>
                Saved
              </span>
            ) : (
              <span className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                Save
              </span>
            )}
          </ModernButton>
          
          <ModernButton
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              shuffleQuote();
            }}
            className="!px-3 !py-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Shuffle
          </ModernButton>
          
          <ModernButton
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              nextQuote();
            }}
            className="!px-3 !py-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </ModernButton>
        </motion.div>
      )}
    </GlassCard>
  );
}
