"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/utils/supabaseClient";

export default function WouldYouRatherGame({ onClose }) {
  const [question, setQuestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedOption, setSelectedOption] = useState(null);
  const [results, setResults] = useState({ optionA: 0, optionB: 0 });
  const [showResults, setShowResults] = useState(false);
  const [error, setError] = useState(null);

  // Function to fetch a new "Would You Rather" question
  const fetchQuestion = async (retryCount = 0) => {
    try {
      setLoading(true);
      setError(null); // Clear any previous errors

      console.log('Fetching Would You Rather question, attempt:', retryCount + 1);

      const response = await fetch('/api/would-you-rather/generate');

      if (!response.ok) {
        console.error(`API responded with status: ${response.status}`);
        throw new Error(`Failed to fetch question (Status: ${response.status})`);
      }

      const data = await response.json();

      if (data.success) {
        console.log('Successfully fetched question:', data.source);
        setQuestion(data);
        // Reset state for new question
        setSelectedOption(null);
        setShowResults(false);

        // Simulate some initial votes for a better UX
        setResults({
          optionA: Math.floor(Math.random() * 30) + 10,
          optionB: Math.floor(Math.random() * 30) + 10
        });
      } else {
        console.error('API returned success: false', data.error);
        throw new Error(data.error || 'Failed to generate question');
      }
    } catch (error) {
      console.error('Error fetching Would You Rather question:', error);

      // If this is the first failure, try once more
      if (retryCount === 0) {
        console.log('Retrying question fetch...');
        setTimeout(() => fetchQuestion(retryCount + 1), 1000);
        return;
      }

      setError('Could not load the game. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Handle option selection
  const handleSelect = (option) => {
    if (selectedOption || showResults) return;

    setSelectedOption(option);

    // Update the results based on selection
    setResults(prev => ({
      ...prev,
      [option]: prev[option] + 1
    }));

    // Show results after a short delay
    setTimeout(() => {
      setShowResults(true);
    }, 500);

    // Record the selection in Supabase if available
    try {
      if (supabase) {
        // This is a simple anonymous vote recording
        // In a production app, you might want to track by user ID
        supabase
          .from('would_you_rather_responses')
          .insert([
            {
              question_id: question.question, // Using question text as ID for simplicity
              selected_option: option
            }
          ])
          .then(({ error }) => {
            if (error) console.error('Error recording response:', error);
          });
      }
    } catch (err) {
      // Silently fail - this is just for analytics
      console.error('Error recording response:', err);
    }
  };

  // Calculate percentages for results
  const calculatePercentage = (option) => {
    const total = results.optionA + results.optionB;
    if (total === 0) return 0;
    return Math.round((results[option] / total) * 100);
  };

  // Fetch a question when the component mounts
  useEffect(() => {
    fetchQuestion();
  }, []);

  // If there's an error, show error message with retry option
  if (error) {
    return (
      <motion.div
        className="w-64 bg-white text-gray-800 text-sm rounded-2xl shadow-2xl p-5 z-40 border border-indigo-100"
        initial={{ opacity: 0, y: 10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 5, scale: 0.98 }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-center">
          <p className="text-red-500 mb-3">{error}</p>
          <div className="flex justify-center space-x-2">
            <button
              onClick={() => fetchQuestion()}
              className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium hover:bg-indigo-200 transition-colors flex items-center"
            >
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
              </svg>
              Retry
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-200 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  // If loading, show loading state
  if (loading || !question) {
    return (
      <motion.div
        className="w-64 bg-white text-gray-800 text-sm rounded-2xl shadow-2xl p-5 z-40 border border-indigo-100"
        initial={{ opacity: 0, y: 10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 5, scale: 0.98 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex justify-center items-center h-24">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500"></div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="w-80 bg-white text-gray-800 text-sm rounded-2xl shadow-2xl p-5 z-40 border border-indigo-100"
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{
        opacity: 1,
        y: 0,
        scale: [1, 1.02, 1],
        boxShadow: [
          "0 4px 6px rgba(0, 0, 0, 0.1)",
          "0 8px 20px rgba(91, 104, 246, 0.3)",
          "0 4px 6px rgba(0, 0, 0, 0.1)"
        ]
      }}
      exit={{ opacity: 0, y: 5, scale: 0.98 }}
      transition={{
        duration: 0.7,
        scale: {
          duration: 1.2,
          repeat: 1,
          repeatType: "reverse"
        },
        boxShadow: {
          duration: 1.5,
          repeat: 1,
          repeatType: "reverse"
        }
      }}
    >
      {/* Speech bubble triangle pointing down to the assistant icon */}
      <div className="after:absolute after:bottom-[-8px] after:right-6 after:w-4 after:h-4 after:bg-white after:rotate-45 after:border-r after:border-b after:border-indigo-100"></div>

      {/* Game header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <span className="text-lg mr-2">🤔</span>
          <h3 className="font-medium text-indigo-800">Would You Rather?</h3>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
          aria-label="Close"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>

      {/* Question */}
      <p className="text-center font-medium text-gray-700 mb-4">
        {question.question}
      </p>

      {/* Options */}
      <div className="space-y-3 mb-4">
        {/* Option A */}
        <button
          onClick={() => handleSelect('optionA')}
          disabled={selectedOption !== null}
          className={`w-full p-3 rounded-xl text-left transition-all ${
            selectedOption === 'optionA'
              ? 'bg-indigo-100 border-2 border-indigo-300'
              : 'bg-indigo-50 border border-indigo-100 hover:bg-indigo-100'
          }`}
        >
          <div className="flex justify-between items-center">
            <span>{question.optionA}</span>
            {showResults && (
              <span className="text-indigo-700 font-bold">{calculatePercentage('optionA')}%</span>
            )}
          </div>

          {/* Progress bar for results */}
          {showResults && (
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <motion.div
                className="bg-indigo-500 h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${calculatePercentage('optionA')}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </div>
          )}
        </button>

        {/* Option B */}
        <button
          onClick={() => handleSelect('optionB')}
          disabled={selectedOption !== null}
          className={`w-full p-3 rounded-xl text-left transition-all ${
            selectedOption === 'optionB'
              ? 'bg-indigo-100 border-2 border-indigo-300'
              : 'bg-indigo-50 border border-indigo-100 hover:bg-indigo-100'
          }`}
        >
          <div className="flex justify-between items-center">
            <span>{question.optionB}</span>
            {showResults && (
              <span className="text-indigo-700 font-bold">{calculatePercentage('optionB')}%</span>
            )}
          </div>

          {/* Progress bar for results */}
          {showResults && (
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <motion.div
                className="bg-indigo-500 h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${calculatePercentage('optionB')}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </div>
          )}
        </button>
      </div>

      {/* Insight after selection */}
      {showResults && (
        <motion.div
          className="bg-indigo-50 p-3 rounded-xl border border-indigo-100 text-indigo-800 italic text-sm"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <p>{question.insight}</p>
        </motion.div>
      )}

      {/* Footer with actions */}
      <div className="flex justify-between mt-4">
        <button
          onClick={fetchQuestion}
          className="px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium hover:bg-indigo-200 transition-colors flex items-center"
        >
          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
          </svg>
          New Question
        </button>

        <button
          onClick={onClose}
          className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-xs font-medium hover:bg-gray-200 transition-colors"
        >
          Close
        </button>
      </div>
    </motion.div>
  );
}
