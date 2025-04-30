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

export default function HeroQuote() {
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

  // Initial quote fetch and display
  useEffect(() => {
    // Fetch the first quote
    fetchQuote();

    // Show the quote after a short delay
    const timer = setTimeout(() => {
      setVisible(true);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {visible && !loading && (
        <motion.div
          className="mt-6 max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            type: "spring",
            stiffness: 100,
            damping: 15,
            delay: 0.3
          }}
        >
          <motion.div
            className="bg-white/20 backdrop-blur-sm rounded-xl p-4 border border-white/30"
            whileHover={{ scale: 1.01 }}
            initial={{ boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)" }}
            animate={{
              boxShadow: [
                "0 4px 6px rgba(0, 0, 0, 0.1)",
                "0 6px 15px rgba(255, 255, 255, 0.2)",
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
            <p className="italic text-white text-center font-serif text-lg md:text-xl">
              "{quote}"
            </p>
            {author && (
              <p className="text-right text-sm text-white/80 mt-2 font-medium">
                — {author}
              </p>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
