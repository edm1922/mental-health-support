"use client";
import React, { useState, useRef, useEffect } from 'react';
import { GlassCard } from './ui/ModernUI';

export default function EmotionAIAssistant() {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState(null);
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
          text: "Hi there! I'm your Emotion AI Assistant powered by DeepSeek-V3. I'm here to chat, offer support, or just listen. How are you feeling today?",
          emotion: 'neutral'
        }
      ]);
    }
  }, [isOpen, messages.length]);

  // Client-side emotion detection as fallback
  const detectEmotionClientSide = (message) => {
    const messageLower = message.toLowerCase();

    // Simple keyword detection
    if (messageLower.includes('happy') || messageLower.includes('joy') || messageLower.includes('great')) {
      return { emotion: 'happy', score: 0.8 };
    } else if (messageLower.includes('sad') || messageLower.includes('unhappy') || messageLower.includes('depressed')) {
      return { emotion: 'sad', score: -0.7 };
    } else if (messageLower.includes('angry') || messageLower.includes('mad') || messageLower.includes('furious')) {
      return { emotion: 'angry', score: -0.9 };
    } else if (messageLower.includes('anxious') || messageLower.includes('worried') || messageLower.includes('nervous')) {
      return { emotion: 'anxious', score: -0.5 };
    } else if (messageLower.includes('confused') || messageLower.includes('unsure') || messageLower.includes('uncertain')) {
      return { emotion: 'confused', score: -0.2 };
    } else if (messageLower.includes('die') || messageLower.includes('suicide') || messageLower.includes('kill') ||
               messageLower.includes('wanna die') || messageLower.includes('want to die')) {
      return { emotion: 'crisis', score: -1.0 };
    } else {
      return { emotion: 'neutral', score: 0 };
    }
  };

  // Client-side response generation as fallback
  const generateResponseClientSide = (emotion) => {
    switch(emotion) {
      case 'happy':
        return "It's wonderful to hear you're feeling positive! That's something to celebrate. What's bringing you joy today?";
      case 'sad':
        return "I notice you might be feeling down right now. That's completely okay - we all have moments like this. Would you like to talk more about what's troubling you?";
      case 'angry':
        return "I can sense you might be feeling frustrated or upset. Those feelings are valid and important. Would it help to talk through what's bothering you?";
      case 'anxious':
        return "It sounds like you might be experiencing some worry or anxiety. That's a natural response to stress. Would it help to take a few deep breaths together?";
      case 'confused':
        return "It seems like you might be feeling a bit uncertain right now. That's completely understandable. Sometimes things can be overwhelming or unclear.";
      case 'crisis':
        return "I'm really concerned about what you've shared. These thoughts are serious, and it's important you speak with a mental health professional right away. Please call the National Suicide Prevention Lifeline at 988.";
      default:
        return "I'm your Emotion AI Assistant. I'm here to chat and provide support. How can I help you today?";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!newMessage.trim()) return;

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
      const emotionAnalysis = detectEmotionClientSide(userMessageText);
      const isCrisis = emotionAnalysis.emotion === 'crisis';
      const fallbackResponse = generateResponseClientSide(emotionAnalysis.emotion);

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

  // Get emoji based on emotion
  const getEmotionEmoji = (emotion) => {
    switch (emotion) {
      case 'happy': return '😊';
      case 'sad': return '😔';
      case 'angry': return '😠';
      case 'anxious': return '😰';
      case 'confused': return '😕';
      case 'neutral': return '😌';
      case 'crisis': return '⚠️';
      default: return '🤖';
    }
  };

  // Toggle chat open/closed
  const toggleChat = () => {
    setIsOpen(prev => !prev);
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
