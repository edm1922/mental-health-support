"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PersonaQuoteBox from "./PersonaQuoteBox";

export default function QuotePopup({
  showInterval = 300000, // 5 minutes by default
  initialDelay = 60000, // 1 minute initial delay
  showDuration = 20000, // 20 seconds display time
  enabled = true
}) {
  const [showQuote, setShowQuote] = useState(false);
  const [hasShown, setHasShown] = useState(false);
  const [userDismissed, setUserDismissed] = useState(false);
  const [quoteKey, setQuoteKey] = useState(0); // Add a key to force re-render

  // Check if we should show quotes based on user preference
  useEffect(() => {
    const quotesDisabled = localStorage.getItem("disableQuotePopups") === "true";
    if (quotesDisabled) {
      enabled = false;
    }
  }, []);

  // Initial delay before showing the first quote
  useEffect(() => {
    if (!enabled) return;

    const timer = setTimeout(() => {
      if (!userDismissed) {
        setShowQuote(true);
        setHasShown(true);
      }
    }, initialDelay);

    return () => clearTimeout(timer);
  }, [initialDelay, enabled, userDismissed]);

  // Set up interval for showing quotes
  useEffect(() => {
    if (!enabled || !hasShown) return;

    const intervalTimer = setInterval(() => {
      if (!userDismissed) {
        setShowQuote(true);
      }
    }, showInterval);

    return () => clearInterval(intervalTimer);
  }, [showInterval, hasShown, enabled, userDismissed]);

  // Auto-hide the quote after showDuration
  useEffect(() => {
    if (!showQuote) return;

    const hideTimer = setTimeout(() => {
      setShowQuote(false);
    }, showDuration);

    return () => clearTimeout(hideTimer);
  }, [showQuote, showDuration]);

  const handleClose = () => {
    setShowQuote(false);
  };

  const handleDisable = () => {
    setShowQuote(false);
    setUserDismissed(true);
    localStorage.setItem("disableQuotePopups", "true");
  };

  const handleNewQuote = () => {
    // Force a re-render with a new key
    setQuoteKey(prevKey => prevKey + 1);
  };

  return (
    <AnimatePresence>
      {showQuote && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed bottom-4 right-4 z-50 max-w-md drop-shadow-xl"
        >
          <div className="relative">
            <PersonaQuoteBox
              key={quoteKey}
              autoRotate={false}
              showControls={true}
              isPopup={true}
              onPopupClose={handleClose}
              onNewQuote={handleNewQuote}
            />

            <div className="mt-2 flex justify-end">
              <button
                onClick={handleDisable}
                className="text-xs bg-white px-2 py-1 rounded-md shadow-sm border border-gray-200 text-gray-600 hover:text-gray-800 hover:bg-gray-50 transition-colors"
              >
                Don't show again
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
