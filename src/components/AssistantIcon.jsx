"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import QuoteBubble from "./QuoteBubble";
import WouldYouRatherGame from "./WouldYouRatherGame";

export default function AssistantIcon() {
  const [isHovered, setIsHovered] = useState(false);
  const [showQuote, setShowQuote] = useState(false);
  const [showGame, setShowGame] = useState(false);
  const [quoteKey, setQuoteKey] = useState(0);
  const [gameKey, setGameKey] = useState(0);

  // Check for user login
  useEffect(() => {
    // This will run when the component mounts and when auth state changes
    const checkUserLogin = async () => {
      try {
        // Check if there's a session token in localStorage (simple way to detect login)
        const hasSession = localStorage.getItem('supabase.auth.token') !== null;

        if (hasSession) {
          // If user just logged in, show a quote
          setQuoteKey(prev => prev + 1);
          setShowQuote(true);
        }
      } catch (error) {
        console.error("Error checking login status:", error);
      }
    };

    checkUserLogin();

    // Listen for storage events (login/logout)
    const handleStorageChange = (e) => {
      if (e.key === 'supabase.auth.token') {
        if (e.newValue && !e.oldValue) {
          // User just logged in
          setQuoteKey(prev => prev + 1);
          setShowQuote(true);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Show quote immediately on page load/refresh and periodically after
  useEffect(() => {
    // Force show quote immediately on mount with a slight delay for better UX
    const initialTimer = setTimeout(() => {
      setShowQuote(true);
    }, 1500);

    // Set up interval to show quotes every 3 minutes (180000ms)
    const quoteTimer = setInterval(() => {
      // Only show quote if game is not showing
      if (!showGame) {
        setQuoteKey(prev => prev + 1);
        setShowQuote(true);
      }
    }, 180000);

    // Set up interval to show the game every 10 minutes (600000ms)
    const gameTimer = setTimeout(() => {
      // Only show game if quote is not showing
      if (!showQuote) {
        setGameKey(prev => prev + 1);
        setShowGame(true);
      }
    }, 600000); // Show after 10 minutes

    return () => {
      clearTimeout(initialTimer);
      clearInterval(quoteTimer);
      clearTimeout(gameTimer);
    };
  }, [showGame, showQuote]);

  // Auto-hide the quote after 10 seconds
  useEffect(() => {
    if (!showQuote) return;

    // Hide quote after 10 seconds
    const hideTimer = setTimeout(() => {
      setShowQuote(false);
    }, 10000);

    return () => clearTimeout(hideTimer);
  }, [showQuote, quoteKey]);

  // Auto-hide the game after 30 seconds
  useEffect(() => {
    if (!showGame) return;

    // Hide game after 30 seconds
    const hideTimer = setTimeout(() => {
      setShowGame(false);
    }, 30000);

    return () => clearTimeout(hideTimer);
  }, [showGame, gameKey]);

  return (
    <div className="fixed bottom-20 right-6 z-40">
      <div className="relative">
        {/* Quote Bubble - positioned to appear above the existing assistant icon */}
        <AnimatePresence>
          {showQuote && <QuoteBubble key={quoteKey} onClose={() => setShowQuote(false)} />}
        </AnimatePresence>

        {/* Would You Rather Game - positioned to appear above the existing assistant icon */}
        <AnimatePresence>
          {showGame && <WouldYouRatherGame key={gameKey} onClose={() => setShowGame(false)} />}
        </AnimatePresence>
      </div>
    </div>
  );
}
