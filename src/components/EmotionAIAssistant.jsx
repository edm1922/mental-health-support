"use client";
import React, { useState, useRef, useEffect } from 'react';
import { GlassCard } from './ui/ModernUI';
import WouldYouRatherGameInline from './WouldYouRatherGameInline';
import { detectEmotion, generateFallbackResponse, getEmotionEmoji } from '@/utils/emotionDetection';

export default function EmotionAIAssistant() {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState(null);
  const [isGameActive, setIsGameActive] = useState(false);
  const [gameKey, setGameKey] = useState(0);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Focus input when chat is opened
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  // Add welcome message when chat is first opened
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          id: 'welcome',
          type: 'assistant',
          text: "Hi there! I'm your Emotion AI Assistant powered by DeepSeek-V3. I'm here to chat, offer support, or just listen. You can also type 'play game' to try our 'Would You Rather' mental health game! How are you feeling today?",
          emotion: 'neutral'
        }
      ]);
    }
  }, [isOpen, messages.length]);

  // Using the imported utility functions for emotion detection and response generation

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!newMessage.trim()) return;

    // Check if the user wants to play the game
    const messageLower = newMessage.toLowerCase().trim();
    if (
      messageLower === 'play' ||
      messageLower === 'play game' ||
      messageLower === 'would you rather' ||
      messageLower === 'play would you rather' ||
      messageLower.includes('play a game') ||
      (messageLower.includes('would you rather') && messageLower.includes('play'))
    ) {
      // Add user message
      const userMessage = {
        id: Date.now().toString(),
        type: 'user',
        text: newMessage.trim()
      };

      setMessages(prev => [...prev, userMessage]);
      setNewMessage('');

      // Start the game
      setTimeout(() => {
        startGame();
      }, 500);

      return;
    }

    // Add user message to chat
    const userMessage = {
      id: Date.now().toString(),
      type: 'user',
      text: newMessage.trim()
    };

    setMessages(prev => [...prev, userMessage]);
    setNewMessage('');
    setIsTyping(true);
    setError(null);

    try {
      // Try the main DeepSeek API endpoint first
      let response;
      try {
        response = await fetch('/api/ai-assistant/deepseek-chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            message: userMessage.text
          })
        });
      } catch (mainApiError) {
        console.error('Error with main API, trying fallback:', mainApiError);
        // If the main endpoint fails, try the fallback
        response = await fetch('/api/ai-assistant/deepseek-fallback', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            message: userMessage.text
          })
        });
      }

      // Check for network errors
      if (!response) {
        throw new Error('Network error - no response received');
      }

      // Try to parse the JSON response
      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error('Error parsing JSON response:', jsonError);
        throw new Error('Failed to parse response from server');
      }

      // Check for API errors
      if (!response.ok) {
        throw new Error(data.error || data.details || 'Failed to get response from server');
      }

      // Check if we have a valid response
      if (!data.response) {
        throw new Error('Invalid response format from server');
      }

      // Add assistant response to chat
      const isCrisis = data.emotion === 'crisis';

      setMessages(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          type: 'assistant',
          text: data.response,
          emotion: data.emotion || 'neutral',
          isCrisis: isCrisis
        }
      ]);

      // If this is a crisis message, also show a prominent error message
      if (isCrisis) {
        setError('If you\'re in crisis, please call 988 (National Suicide Prevention Lifeline) or text HOME to 741741 (Crisis Text Line).');
      }
    } catch (err) {
      console.error('Error sending message:', err);

      // Use client-side fallback when server is unavailable
      const userMessageText = userMessage.text;
      const emotionAnalysis = detectEmotion(userMessageText);
      const isCrisis = emotionAnalysis.emotion === 'crisis';
      const fallbackResponse = generateFallbackResponse(emotionAnalysis.emotion);

      console.log('Using client-side fallback:', {
        emotion: emotionAnalysis.emotion,
        isCrisis: isCrisis
      });

      // Add fallback response
      setMessages(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          type: 'assistant',
          text: fallbackResponse,
          emotion: emotionAnalysis.emotion,
          isCrisis: isCrisis,
          isClientSideFallback: true
        }
      ]);

      // Set appropriate error message
      if (isCrisis) {
        setError('If you\'re in crisis, please call 988 (National Suicide Prevention Lifeline) or text HOME to 741741 (Crisis Text Line).');
      } else {
        setError('Using offline mode due to connection issues. Some features may be limited.');
      }
    } finally {
      setIsTyping(false);
    }
  };

  // Using the imported getEmotionEmoji function

  // Toggle chat open/closed
  const toggleChat = () => {
    setIsOpen(prev => !prev);
  };

  // Start the Would You Rather game
  const startGame = () => {
    // Reset any previous game state
    setIsGameActive(true);
    setGameKey(prev => prev + 1);

    // Clear any errors
    setError(null);
  };

  // Handle game message
  const handleGameMessage = (message) => {
    setMessages(prev => [...prev, message]);

    // If this is a user message or a results message, end the active game state
    if (message.type === 'user' || message.text.includes('Results:')) {
      setIsGameActive(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Chat button */}
      <button
        onClick={toggleChat}
        className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center"
        aria-label="Open Emotion AI Assistant"
      >
        {isOpen ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        )}
      </button>

      {/* Chat window */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 w-80 sm:w-96 h-[500px] max-h-[80vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 animate-fadeIn">
          <GlassCard className="flex flex-col h-full p-0 overflow-hidden">
            {/* Chat header */}
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-4 flex items-center justify-between">
              <div className="flex items-center">
                <span className="text-2xl mr-2">🤖</span>
                <div>
                  <h3 className="font-semibold">Emotion AI Assistant</h3>
                  <p className="text-xs text-white/80">Powered by DeepSeek-V3</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {/* Game button */}
                <button
                  onClick={startGame}
                  className="text-white hover:bg-white/20 rounded-full p-1.5 transition-colors"
                  aria-label="Play Would You Rather game"
                  title="Play Would You Rather game"
                  disabled={isGameActive}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>

                {/* Close button */}
                <button
                  onClick={toggleChat}
                  className="text-white hover:bg-white/20 rounded-full p-1"
                  aria-label="Close chat"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Chat messages */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
              {messages.map(message => (
                <div
                  key={message.id}
                  className={`mb-4 flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                      message.type === 'user'
                        ? 'bg-blue-500 text-white rounded-br-none'
                        : message.isCrisis
                          ? 'bg-red-50 border border-red-200 shadow-sm rounded-bl-none'
                          : message.isGame
                            ? 'bg-indigo-50 border border-indigo-200 shadow-sm rounded-bl-none'
                            : 'bg-white border border-gray-200 shadow-sm rounded-bl-none'
                    }`}
                  >
                    {message.type === 'assistant' && (
                      <div className="flex items-center mb-1">
                        <span className="text-lg mr-1">{getEmotionEmoji(message.emotion)}</span>
                        <span className="text-xs text-gray-500">
                          AI Assistant
                          {message.isClientSideFallback && (
                            <span className="ml-1 px-1 py-0.5 bg-yellow-100 text-yellow-800 rounded text-[10px]">
                              offline mode
                            </span>
                          )}
                        </span>
                      </div>
                    )}
                    <p className={`text-sm ${
                      message.type === 'user'
                        ? 'text-white'
                        : message.isCrisis
                          ? 'text-red-800 font-medium'
                          : message.isGame
                            ? 'text-indigo-800 whitespace-pre-line'
                            : 'text-gray-800'
                    }`}>
                      {message.text}
                    </p>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex justify-start mb-4">
                  <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-none px-4 py-2 shadow-sm">
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className={`p-3 rounded-lg text-sm mb-4 ${
                  messages.some(m => m.isCrisis)
                    ? 'bg-red-100 text-red-800 border border-red-300 font-medium'
                    : 'bg-red-50 text-red-600'
                }`}>
                  {messages.some(m => m.isCrisis) && (
                    <div className="flex items-center mb-1">
                      <span className="text-lg mr-2">⚠️</span>
                      <span className="font-bold">Crisis Resources</span>
                    </div>
                  )}
                  {error}
                </div>
              )}

              {/* Game component */}
              {isGameActive && (
                <div className="mb-4">
                  <WouldYouRatherGameInline
                    key={gameKey}
                    onClose={() => setIsGameActive(false)}
                    onSendMessage={handleGameMessage}
                  />
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Chat input */}
            <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200 bg-white">
              <div className="flex items-center">
                <input
                  type="text"
                  ref={inputRef}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 border border-gray-300 rounded-l-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isTyping}
                />
                <button
                  type="submit"
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-r-lg disabled:opacity-50"
                  disabled={isTyping || !newMessage.trim()}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
            </form>
          </GlassCard>
        </div>
      )}
    </div>
  );
}
