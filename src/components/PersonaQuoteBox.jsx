"use client";
import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/utils/supabaseClient";
import { GlassCard, ModernButton } from "@/components/ui/ModernUI";
import { useCallback } from "react";

// Define our personas with their emoji and role
const personas = [
  { emoji: "👩‍⚕️", role: "Therapist", color: "bg-blue-100 text-blue-700" },
  { emoji: "🧘‍♀️", role: "Mindfulness Coach", color: "bg-green-100 text-green-700" },
  { emoji: "🧠", role: "Mental Health Expert", color: "bg-purple-100 text-purple-700" },
  { emoji: "💪", role: "Motivational Coach", color: "bg-orange-100 text-orange-700" },
  { emoji: "🌱", role: "Growth Mentor", color: "bg-emerald-100 text-emerald-700" },
  { emoji: "🌟", role: "Positivity Guide", color: "bg-yellow-100 text-yellow-700" },
  { emoji: "🤗", role: "Support Friend", color: "bg-pink-100 text-pink-700" },
  { emoji: "🧸", role: "Comfort Companion", color: "bg-amber-100 text-amber-700" },
];

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      when: "beforeChildren",
      staggerChildren: 0.2,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      when: "afterChildren",
      staggerChildren: 0.1,
      staggerDirection: -1,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: "spring", stiffness: 300, damping: 24 }
  },
  exit: { y: -20, opacity: 0 }
};

const bubbleVariants = {
  hidden: { scale: 0.8, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: { type: "spring", stiffness: 500, damping: 25 }
  },
  exit: { scale: 0.8, opacity: 0 }
};

export default function PersonaQuoteBox({
  autoRotate = true,
  rotationInterval = 10000,
  showControls = true,
  className = "",
  onPopupClose = null,
  onNewQuote = null,
  isPopup = false,
  useAiQuotes = true
}) {
  const [quotes, setQuotes] = useState([]);
  const [aiQuotes, setAiQuotes] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [persona, setPersona] = useState(personas[0]);
  const [quoteSource, setQuoteSource] = useState('database'); // 'database' or 'ai'
  const autoRotateTimerRef = useRef(null);

  // Function to fetch AI-generated quotes
  const fetchAiQuote = useCallback(async () => {
    try {
      const response = await fetch('/api/quotes/deepseek');
      if (!response.ok) {
        throw new Error('Failed to fetch AI quote');
      }

      const data = await response.json();
      if (data.success) {
        // Add a unique ID to the quote
        const newQuote = {
          id: `ai-${Date.now()}`,
          quote: data.quote,
          author: data.author,
          source: 'ai'
        };

        setAiQuotes(prev => {
          // Keep only the last 5 AI quotes to avoid memory issues
          const updatedQuotes = [...prev, newQuote].slice(-5);
          return updatedQuotes;
        });

        return newQuote;
      }
    } catch (err) {
      console.error("Error fetching AI quote:", err);
      return null;
    }
  }, []);

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
          // Add source property to database quotes
          const dbQuotes = data.map(quote => ({
            ...quote,
            source: 'database'
          }));

          setQuotes(dbQuotes);

          // Set a random starting persona
          setPersona(personas[Math.floor(Math.random() * personas.length)]);

          // Also fetch an initial AI quote if enabled
          if (useAiQuotes) {
            fetchAiQuote();
          }
        } else {
          setQuotes([
            {
              id: 1,
              quote: "Your mental health is a priority. Your happiness is essential.",
              author: "Unknown",
              source: 'database'
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
            author: "Unknown",
            source: 'database'
          }
        ]);
      } finally {
        setLoading(false);
      }
    }

    fetchQuotes();
  }, [fetchAiQuote, useAiQuotes]);

  // Auto-rotate quotes
  useEffect(() => {
    if (autoRotate && !loading && (quotes.length > 1 || aiQuotes.length > 0)) {
      autoRotateTimerRef.current = setInterval(() => {
        nextQuote();
      }, rotationInterval);
    }

    return () => {
      if (autoRotateTimerRef.current) {
        clearInterval(autoRotateTimerRef.current);
      }
    };
  }, [autoRotate, quotes, aiQuotes, loading, currentIndex, rotationInterval]);

  // Get all available quotes (database + AI)
  const getAllQuotes = useCallback(() => {
    // Combine database and AI quotes
    return [...quotes, ...aiQuotes];
  }, [quotes, aiQuotes]);

  // Get the current quote
  const getCurrentQuote = useCallback(() => {
    const allQuotes = getAllQuotes();

    // If there are no quotes at all, return a default quote
    if (allQuotes.length === 0) {
      return {
        id: 0,
        quote: "Your mental health is a priority. Your happiness is essential.",
        author: "Unknown",
        source: 'database'
      };
    }

    // Make sure we don't go out of bounds
    const safeIndex = currentIndex % allQuotes.length;
    return allQuotes[safeIndex];
  }, [getAllQuotes, currentIndex]);

  const nextQuote = () => {
    const allQuotes = getAllQuotes();
    if (allQuotes.length === 0) return;

    // Decide whether to fetch a new AI quote
    const shouldFetchNewAiQuote = useAiQuotes && Math.random() > 0.7;

    if (shouldFetchNewAiQuote) {
      fetchAiQuote().then(newQuote => {
        if (newQuote) {
          // Switch to the new AI quote
          setQuoteSource('ai');
          setCurrentIndex(allQuotes.length); // This will point to the new quote after it's added
        } else {
          // If AI quote fetch failed, just go to next quote
          setCurrentIndex((prevIndex) => (prevIndex + 1) % allQuotes.length);
        }
      });
    } else {
      // Regular quote rotation
      setCurrentIndex((prevIndex) => (prevIndex + 1) % allQuotes.length);
      // Update quote source
      const nextQuote = allQuotes[(currentIndex + 1) % allQuotes.length];
      if (nextQuote) {
        setQuoteSource(nextQuote.source || 'database');
      }
    }

    // Change persona occasionally
    if (Math.random() > 0.7) {
      setPersona(personas[Math.floor(Math.random() * personas.length)]);
    }
  };

  const prevQuote = () => {
    const allQuotes = getAllQuotes();
    if (allQuotes.length === 0) return;

    setCurrentIndex((prevIndex) => (prevIndex - 1 + allQuotes.length) % allQuotes.length);

    // Update quote source
    const prevQuoteIndex = (currentIndex - 1 + allQuotes.length) % allQuotes.length;
    const prevQuote = allQuotes[prevQuoteIndex];
    if (prevQuote) {
      setQuoteSource(prevQuote.source || 'database');
    }

    // Change persona occasionally
    if (Math.random() > 0.7) {
      setPersona(personas[Math.floor(Math.random() * personas.length)]);
    }
  };

  const shuffleQuote = async () => {
    const allQuotes = getAllQuotes();
    if (allQuotes.length === 0) return;

    // 50% chance to fetch a new AI quote if enabled
    if (useAiQuotes && Math.random() > 0.5) {
      setLoading(true);
      const newQuote = await fetchAiQuote();
      setLoading(false);

      if (newQuote) {
        // Point to the new AI quote (which will be at the end of the array)
        setCurrentIndex(allQuotes.length);
        setQuoteSource('ai');
      } else {
        // If AI quote fetch failed, just show a random existing quote
        let newIndex;
        do {
          newIndex = Math.floor(Math.random() * allQuotes.length);
        } while (newIndex === currentIndex && allQuotes.length > 1);

        setCurrentIndex(newIndex);
        setQuoteSource(allQuotes[newIndex].source || 'database');
      }
    } else {
      // Just shuffle to an existing quote
      let newIndex;
      do {
        newIndex = Math.floor(Math.random() * allQuotes.length);
      } while (newIndex === currentIndex && allQuotes.length > 1);

      setCurrentIndex(newIndex);
      setQuoteSource(allQuotes[newIndex].source || 'database');
    }

    // Always change persona when shuffling
    setPersona(personas[Math.floor(Math.random() * personas.length)]);

    // Call the onNewQuote callback if provided
    if (onNewQuote) {
      onNewQuote();
    }
  };

  // If loading or no quotes, show placeholder
  if (loading) {
    return (
      <GlassCard className={`flex items-center justify-center p-8 ${className}`}>
        <div className="animate-pulse flex flex-col items-center space-y-4 w-full">
          <div className="h-16 w-16 bg-gray-200 rounded-full"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </GlassCard>
    );
  }

  if (error || (quotes.length === 0 && aiQuotes.length === 0)) {
    return (
      <GlassCard className={`p-8 ${className}`}>
        <p className="text-center text-gray-600">
          {error || "No inspirational quotes available at the moment."}
        </p>
      </GlassCard>
    );
  }

  const currentQuote = getCurrentQuote();

  // Add a visual indicator for AI-generated quotes
  const isAiQuote = currentQuote.source === 'ai';

  return (
    <GlassCard
      className={`overflow-hidden relative ${isPopup ? 'max-w-md mx-auto shadow-2xl bg-blue-50 border-2 border-blue-300' : 'bg-gradient-to-br from-blue-50 to-indigo-100 border border-blue-200'} ${className}`}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex + persona.emoji}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="p-6"
        >
          {/* Character/Persona */}
          <motion.div
            variants={itemVariants}
            className="flex items-center mb-4"
          >
            <motion.div
              className={`h-16 w-16 rounded-full ${persona.color} flex items-center justify-center text-3xl mr-3`}
              whileHover={{ scale: 1.1, rotate: [0, -5, 5, -5, 0] }}
              transition={{ duration: 0.5 }}
            >
              {persona.emoji}
            </motion.div>
            <div>
              <h3 className="font-bold text-gray-800">{persona.role}</h3>
              <p className="text-sm text-gray-500">Sharing wisdom</p>
            </div>
          </motion.div>

          {/* Quote Bubble */}
          <motion.div
            variants={bubbleVariants}
            className={`relative ${isAiQuote ? 'bg-gradient-to-br from-indigo-50 to-blue-50' : 'bg-white'} rounded-2xl p-4 shadow-md border-2 ${isAiQuote ? 'border-indigo-300' : 'border-blue-200'} mb-4`}
          >
            {/* Speech bubble triangle */}
            <div className="absolute top-0 left-6 transform -translate-y-full">
              <div className={`w-4 h-4 ${isAiQuote ? 'bg-indigo-50' : 'bg-white'} rotate-45 transform origin-bottom-left border-l border-t ${isAiQuote ? 'border-indigo-300' : 'border-blue-200'}`}></div>
            </div>

            {/* AI badge */}
            {isAiQuote && (
              <div className="absolute top-2 right-2 bg-indigo-100 text-indigo-700 text-xs px-2 py-1 rounded-full font-medium flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                </svg>
                AI
              </div>
            )}

            <p className={`text-lg ${isAiQuote ? 'text-indigo-800' : 'text-gray-700'} mb-2`}>
              "{currentQuote.quote}"
            </p>

            {currentQuote.author !== "Unknown" && (
              <p className={`text-right text-sm ${isAiQuote ? 'text-indigo-600' : 'text-gray-500'} italic`}>
                — {currentQuote.author}
              </p>
            )}
          </motion.div>

          {/* Controls */}
          {showControls && (
            <motion.div
              variants={itemVariants}
              className="flex justify-center space-x-2 mt-4"
            >
              <ModernButton
                variant="outline"
                onClick={prevQuote}
                className="!px-3 !py-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </ModernButton>

              <ModernButton
                variant="primary"
                onClick={shuffleQuote}
                className="!px-3 !py-2"
              >
                <span className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  New Quote
                </span>
              </ModernButton>

              <ModernButton
                variant="outline"
                onClick={nextQuote}
                className="!px-3 !py-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </ModernButton>
            </motion.div>
          )}

          {/* Close button for popup mode */}
          {isPopup && onPopupClose && (
            <motion.div
              className="absolute top-2 right-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <button
                onClick={onPopupClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Close quote popup"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>
    </GlassCard>
  );
}
