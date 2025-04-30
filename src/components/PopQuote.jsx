"use client";
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Default quotes if API fails
const defaultQuotes = [
  "You've survived 100% of your worst days. You're doing better than you think.",
  "Every storm runs out of rain. Keep going.",
  "It's okay to ask for help. You are not alone.",
  "Healing is not linear – give yourself grace.",
  "Small steps still move you forward.",
  "Your mental health is a priority. Your happiness is essential.",
  "You are stronger than you think and braver than you believe.",
];

export default function PopQuote() {
  const [quote, setQuote] = useState("");
  const [author, setAuthor] = useState("");
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(true);

  // Function to fetch a quote from the DeepSeek API
  const fetchQuote = async () => {
    try {
      const response = await fetch('/api/quotes/deepseek');
      if (!response.ok) {
        throw new Error('Failed to fetch quote');
      }

      const data = await response.json();
      if (data.success) {
        setQuote(data.quote);
        setAuthor(data.author);
      } else {
        useRandomDefaultQuote();
      }
    } catch (error) {
      console.error('Error fetching quote:', error);
      useRandomDefaultQuote();
    } finally {
      setLoading(false);
    }
  };

  // Function to use a random default quote
  const useRandomDefaultQuote = () => {
    const randomIndex = Math.floor(Math.random() * defaultQuotes.length);
    setQuote(defaultQuotes[randomIndex]);
    setAuthor("DeepSeek AI");
  };

  // Get a new quote
  const getNewQuote = () => {
    setLoading(true);
    fetchQuote();
  };

  // Initial quote fetch and display
  useEffect(() => {
    // Fetch the first quote
    fetchQuote();

    // Show the quote after a short delay
    const timer = setTimeout(() => {
      setVisible(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  // Auto-hide the quote after some time
  useEffect(() => {
    if (!visible) return;

    const hideTimer = setTimeout(() => {
      setVisible(false);
    }, 15000); // Show for 15 seconds

    return () => clearTimeout(hideTimer);
  }, [visible]);

  // Set up interval to show quotes periodically
  useEffect(() => {
    const intervalTimer = setInterval(() => {
      if (!visible) {
        getNewQuote();
        setVisible(true);
      }
    }, 30000); // Show a new quote every 30 seconds

    return () => clearInterval(intervalTimer);
  }, [visible]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed top-24 left-1/2 transform -translate-x-1/2 z-50 max-w-md w-full"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{
            type: "spring",
            stiffness: 100,
            damping: 15
          }}
        >
          <motion.div
            className="bg-gradient-to-br from-blue-50 to-indigo-50 backdrop-blur-sm rounded-2xl shadow-xl p-5 mx-4 border border-blue-200"
            whileHover={{ scale: 1.02 }}
            initial={{ boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)" }}
            animate={{
              boxShadow: [
                "0 4px 6px rgba(0, 0, 0, 0.1)",
                "0 6px 15px rgba(59, 130, 246, 0.2)",
                "0 4px 6px rgba(0, 0, 0, 0.1)"
              ]
            }}
            transition={{
              boxShadow: {
                duration: 2,
                repeat: Infinity,
                repeatType: "reverse"
              },
              scale: { type: "spring", stiffness: 400, damping: 10 }
            }}
          >
            {loading ? (
              <div className="flex items-center justify-center py-2">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
              </div>
            ) : (
              <>
                <p className="italic text-indigo-800 text-center font-serif text-lg">
                  "{quote}"
                </p>
                {author && (
                  <p className="text-right text-sm text-indigo-600 mt-2 font-medium">
                    — {author}
                  </p>
                )}
                <div className="flex justify-between items-center mt-3">
                  <motion.button
                    onClick={getNewQuote}
                    className="text-xs flex items-center text-blue-600 hover:text-blue-800 transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    New Quote
                  </motion.button>
                  <motion.button
                    onClick={() => setVisible(false)}
                    className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Close
                  </motion.button>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
