"use client";
import React from "react";
import QuotePopup from "./QuotePopup";

export default function QuotePopupProvider() {
  return (
    <QuotePopup 
      showInterval={300000} // Show every 5 minutes
      initialDelay={60000} // Initial delay of 1 minute
      showDuration={20000} // Show for 20 seconds
      enabled={true}
    />
  );
}
