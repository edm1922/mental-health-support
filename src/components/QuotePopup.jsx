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
    // Check if quotes were disabled more than 24 hours ago
    const quotesDisabledTime = localStorage.getItem("disableQuotePopupsTime");
    const quotesDisabled = localStorage.getItem("disableQuotePopups") === "true";

    if (quotesDisabled && quotesDisabledTime) {
      const disabledTime = parseInt(quotesDisabledTime, 10);
      const currentTime = new Date().getTime();
      const hoursSinceDisabled = (currentTime - disabledTime) / (1000 * 60 * 60);

      // If it's been more than 24 hours, re-enable quotes
      if (hoursSinceDisabled > 24) {
        localStorage.removeItem("disableQuotePopups");
        localStorage.removeItem("disableQuotePopupsTime");
      } else {
        enabled = false;
      }
    } else if (quotesDisabled) {
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

    // Add event listener for user activity to occasionally show quotes
    const handleUserActivity = () => {
      // Only show if not already showing and not dismissed
      if (!showQuote && !userDismissed && enabled) {
        // 5% chance to show a quote on user activity
        if (Math.random() < 0.05) {
          // Don't show too frequently - check last shown time
          const lastShown = localStorage.getItem("lastQuoteShownTime");
          const currentTime = new Date().getTime();

          if (!lastShown || (currentTime - parseInt(lastShown, 10)) > 60000) { // At least 1 minute since last shown
            setShowQuote(true);
            localStorage.setItem("lastQuoteShownTime", currentTime.toString());
          }
        }
      }
    };

    // Add event listeners for various user activities
    window.addEventListener('click', handleUserActivity);
    window.addEventListener('scroll', handleUserActivity);

    return () => {
      clearInterval(intervalTimer);
      window.removeEventListener('click', handleUserActivity);
      window.removeEventListener('scroll', handleUserActivity);
    };
  }, [showInterval, hasShown, enabled, userDismissed, showQuote]);

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
    localStorage.setItem("disableQuotePopupsTime", new Date().getTime().toString());
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

            <div className="mt-2 flex justify-between">
              <button
                onClick={handleNewQuote}
                className="text-xs bg-blue-500 px-3 py-1.5 rounded-md shadow-sm text-white hover:bg-blue-600 transition-colors"
              >
                Show me more quotes
              </button>
              <button
                onClick={handleDisable}
                className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
              >
                Don't show for 24 hours
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
