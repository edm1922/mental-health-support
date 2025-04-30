"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import PopQuote from "@/components/PopQuote";
import HeroQuote from "@/components/HeroQuote";

export default function TestQuotesPage() {
  const [showPopup, setShowPopup] = useState(false);
  const [aiQuote, setAiQuote] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleShowPopup = () => {
    setShowPopup(true);
    // Auto-hide after 20 seconds
    setTimeout(() => {
      setShowPopup(false);
    }, 20000);
  };

  const fetchAiQuote = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/quotes/deepseek');
      if (!response.ok) {
        throw new Error('Failed to fetch AI quote');
      }

      const data = await response.json();
      setAiQuote(data);
    } catch (error) {
      console.error('Error fetching AI quote:', error);
      setAiQuote({
        success: false,
        error: error.message,
        quote: "Failed to fetch AI quote",
        author: "Error"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Quote Testing Page</h1>
          <Link href="/" className="text-blue-600 hover:text-blue-800">
            Back to Home
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-8">
          {/* Test Controls */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Test Controls</h2>

            <div className="space-y-4">
              <div>
                <Button
                  onClick={handleShowPopup}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Show Quote Popup
                </Button>
                <p className="text-sm text-gray-500 mt-2">
                  Shows the quote popup as it would appear to users while browsing.
                </p>
              </div>

              <div>
                <Button
                  onClick={() => {
                    localStorage.removeItem("disableQuotePopups");
                    localStorage.removeItem("disableQuotePopupsTime");
                    alert("Quote preferences reset. Popups are now enabled.");
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  Reset Quote Preferences
                </Button>
                <p className="text-sm text-gray-500 mt-2">
                  Clears any stored preferences that might be preventing quotes from showing.
                </p>
              </div>

              <div>
                <Button
                  onClick={fetchAiQuote}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                  disabled={loading}
                >
                  {loading ? "Loading..." : "Test DeepSeek API"}
                </Button>
                <p className="text-sm text-gray-500 mt-2">
                  Tests the DeepSeek API endpoint directly and displays the result.
                </p>
              </div>
            </div>
          </div>

          {/* AI Quote Result */}
          {aiQuote && (
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">DeepSeek API Result</h2>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-lg font-medium mb-2">"{aiQuote.quote}"</p>
                <p className="text-right text-gray-600 italic">— {aiQuote.author}</p>
              </div>
              <div className="mt-4">
                <h3 className="text-sm font-semibold text-gray-700">API Response:</h3>
                <pre className="bg-gray-100 p-3 rounded-md text-xs mt-2 overflow-auto max-h-40">
                  {JSON.stringify(aiQuote, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {/* Quote Box Preview */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Quote Box Preview</h2>
            <div className="bg-gradient-to-br from-purple-500 to-indigo-600 p-6 rounded-xl">
              <HeroQuote />
            </div>
          </div>
        </div>
      </div>

      {/* Demo popup that appears when button is clicked */}
      {showPopup && (
        <PopQuote />
      )}
    </div>
  );
}
