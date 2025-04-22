"use client";
import React from "react";
import QuotePopup from "./QuotePopup";

export default function QuotePopupProvider() {
  return (
    <QuotePopup
      showInterval={120000} // Show every 2 minutes (was 5 minutes)
      initialDelay={30000} // Initial delay of 30 seconds (was 1 minute)
      showDuration={15000} // Show for 15 seconds (was 20 seconds)
      enabled={true}
    />
  );
}
