"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/utils/supabaseClient";

export default function WouldYouRatherGameInline({ onClose, onSendMessage }) {
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

      console.log('Fetching Would You Rather question for inline game, attempt:', retryCount + 1);

      const response = await fetch('/api/would-you-rather/generate');

      if (!response.ok) {
        console.error(`API responded with status: ${response.status}`);
        throw new Error(`Failed to fetch question (Status: ${response.status})`);
      }

      const data = await response.json();

      if (data.success) {
        console.log('Successfully fetched question for inline game:', data.source);
        setQuestion(data);
        // Reset state for new question
        setSelectedOption(null);
        setShowResults(false);

        // Simulate some initial votes for a better UX
        setResults({
          optionA: Math.floor(Math.random() * 30) + 10,
          optionB: Math.floor(Math.random() * 30) + 10
        });

        // Send the question to the chat
        if (onSendMessage) {
          onSendMessage({
            id: Date.now().toString(),
            type: 'assistant',
            text: `Let's play "Would You Rather"! ${data.question}\n\nA: ${data.optionA}\nB: ${data.optionB}`,
            emotion: 'happy',
            isGame: true
          });
        }
      } else {
        console.error('API returned success: false', data.error);
        throw new Error(data.error || 'Failed to generate question');
      }
    } catch (error) {
      console.error('Error fetching Would You Rather question for inline game:', error);

      // If this is the first failure, try once more
      if (retryCount === 0) {
        console.log('Retrying inline game question fetch...');
        setTimeout(() => fetchQuestion(retryCount + 1), 1000);
        return;
      }

      setError('Could not load the game. Please try again later.');

      // Send error message to chat
      if (onSendMessage) {
        onSendMessage({
          id: Date.now().toString(),
          type: 'assistant',
          text: "I'm sorry, I couldn't load the 'Would You Rather' game right now. Let's try again later.",
          emotion: 'sad'
        });
      }
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

    // Send the selection to the chat
    if (onSendMessage) {
      const optionText = option === 'optionA' ? question.optionA : question.optionB;

      // Send user's choice
      onSendMessage({
        id: Date.now().toString(),
        type: 'user',
        text: `I choose: ${optionText}`
      });

      // Calculate percentages for results
      const totalVotes = results.optionA + results.optionB + 1; // +1 for the current vote
      const percentA = Math.round((option === 'optionA' ? results.optionA + 1 : results.optionA) / totalVotes * 100);
      const percentB = Math.round((option === 'optionB' ? results.optionB + 1 : results.optionB) / totalVotes * 100);

      // Send results and insight
      setTimeout(() => {
        onSendMessage({
          id: Date.now().toString() + '-results',
          type: 'assistant',
          text: `Results:\n${question.optionA}: ${percentA}%\n${question.optionB}: ${percentB}%\n\nInsight: ${question.insight}\n\nWould you like to play again?`,
          emotion: 'happy'
        });
      }, 1000);
    }

    // Record the selection in Supabase if available
    try {
      if (supabase) {
        // This is a simple anonymous vote recording
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

  // Fetch a question when the component mounts
  useEffect(() => {
    fetchQuestion();
  }, []);

  // If there's an error, return null (error is handled by sending a message)
  if (error) {
    return null;
  }

  // If loading, return null (loading is handled by the chat interface)
  if (loading || !question) {
    return null;
  }

  // If the game is active but user hasn't selected yet, render the options
  if (!selectedOption) {
    return (
      <div className="flex flex-col space-y-2 w-full">
        <button
          onClick={() => handleSelect('optionA')}
          className="w-full p-3 rounded-xl text-left transition-all bg-indigo-50 border border-indigo-100 hover:bg-indigo-100"
        >
          {question.optionA}
        </button>

        <button
          onClick={() => handleSelect('optionB')}
          className="w-full p-3 rounded-xl text-left transition-all bg-indigo-50 border border-indigo-100 hover:bg-indigo-100"
        >
          {question.optionB}
        </button>
      </div>
    );
  }

  // If user has selected and results are showing, return null (results are handled by sending messages)
  return null;
}
