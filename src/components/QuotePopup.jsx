"use client";
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PersonaQuoteBox from './PersonaQuoteBox';

export default function QuotePopup({ 
  enabled = true, 
  initialDelay = 2000, 
  showDuration = 15000 
}) {
  const [visible, setVisible] = useState(false);

  // Show the popup after the initial delay
  useEffect(() => {
    if (!enabled) return;
    
    const timer = setTimeout(() => {
      setVisible(true);
    }, initialDelay);

    return () => clearTimeout(timer);
  }, [enabled, initialDelay]);

  // Auto-hide the popup after the show duration
  useEffect(() => {
    if (!visible) return;

    const hideTimer = setTimeout(() => {
      setVisible(false);
    }, showDuration);

    return () => clearTimeout(hideTimer);
  }, [visible, showDuration]);

  const handleClose = () => {
    setVisible(false);
  };

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
          <PersonaQuoteBox 
            isPopup={true}
            autoRotate={false}
            showControls={true}
            onPopupClose={handleClose}
            useAiQuotes={true}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
