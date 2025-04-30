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

export default function CenterQuote() {
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
      setVisible(true);
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

  // Initial quote fetch
  useEffect(() => {
    fetchQuote();

    // Set up interval to refresh quotes
    const intervalTimer = setInterval(() => {
      fetchQuote();
    }, 30000); // New quote every 30 seconds

    return () => clearInterval(intervalTimer);
  }, []);

  return (
    <AnimatePresence>
      {visible && !loading && (
        <motion.div
          className="max-w-2xl mx-auto my-12 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            type: "spring",
            stiffness: 100,
            damping: 15
          }}
        >
          <motion.div
            className="bg-gradient-to-br from-indigo-100 to-purple-100 backdrop-blur-sm rounded-xl shadow-lg p-8 border border-indigo-200"
            whileHover={{ scale: 1.01 }}
            initial={{ boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)" }}
            animate={{
              boxShadow: [
                "0 4px 6px rgba(0, 0, 0, 0.1)",
                "0 6px 15px rgba(99, 102, 241, 0.2)",
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
            <p className="italic text-indigo-900 text-center font-serif text-xl md:text-2xl leading-relaxed">
              "{quote}"
            </p>
            {author && (
              <p className="text-right text-sm text-indigo-700 mt-3 font-medium">
                — {author}
              </p>
            )}
            <div className="mt-4 flex justify-center">
              <motion.button
                onClick={getNewQuote}
                className="px-4 py-2 bg-indigo-600 text-white rounded-full text-sm flex items-center shadow-md hover:bg-indigo-700 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                New Quote
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
