/**
 * Utility functions for emotion detection and response generation
 */

/**
 * Detects emotion from a message using keyword analysis
 * @param {string} message - The user's message
 * @returns {Object} - Object containing detected emotion and sentiment score
 */
export function detectEmotion(message) {
  const message_lower = message.toLowerCase();
  
  // Define emotion keywords
  const emotions = {
    happy: ['happy', 'joy', 'excited', 'great', 'wonderful', 'fantastic', 'glad', 'pleased', 'delighted', 'content', 'cheerful', 'thrilled'],
    sad: ['sad', 'unhappy', 'depressed', 'down', 'miserable', 'heartbroken', 'upset', 'disappointed', 'gloomy', 'hopeless', 'grief', 'sorrow'],
    angry: ['angry', 'mad', 'furious', 'annoyed', 'irritated', 'frustrated', 'outraged', 'enraged', 'hostile', 'bitter', 'hate', 'resent'],
    anxious: ['anxious', 'worried', 'nervous', 'stressed', 'tense', 'uneasy', 'afraid', 'scared', 'fearful', 'panicked', 'overwhelmed', 'concerned'],
    confused: ['confused', 'unsure', 'uncertain', 'puzzled', 'perplexed', 'lost', 'disoriented', 'bewildered', 'doubtful', 'hesitant', 'unclear'],
    neutral: ['ok', 'fine', 'alright', 'neutral', 'average', 'moderate', 'so-so', 'mediocre'],
    crisis: ['die', 'death', 'suicide', 'kill', 'end my life', 'hurt myself', 'self harm', 'harm myself', 'wanna die', 'want to die']
  };
  
  // Count emotion keywords
  const emotionCounts = {};
  for (const [emotion, keywords] of Object.entries(emotions)) {
    emotionCounts[emotion] = keywords.filter(keyword => message_lower.includes(keyword)).length;
  }
  
  // Find the emotion with the highest count
  let dominantEmotion = 'neutral';
  let maxCount = 0;
  
  for (const [emotion, count] of Object.entries(emotionCounts)) {
    if (count > maxCount) {
      maxCount = count;
      dominantEmotion = emotion;
    }
  }
  
  // Calculate a simple sentiment score (-1 to 1)
  let sentimentScore = 0;
  if (dominantEmotion === 'happy') sentimentScore = 0.8;
  else if (dominantEmotion === 'sad') sentimentScore = -0.7;
  else if (dominantEmotion === 'angry') sentimentScore = -0.9;
  else if (dominantEmotion === 'anxious') sentimentScore = -0.5;
  else if (dominantEmotion === 'confused') sentimentScore = -0.2;
  else if (dominantEmotion === 'crisis') sentimentScore = -1.0;
  else sentimentScore = 0;
  
  return {
    emotion: dominantEmotion,
    score: sentimentScore
  };
}

/**
 * Creates a system prompt for the AI based on detected emotion
 * @param {string} emotion - The detected emotion
 * @param {string} userName - Optional user name for personalization
 * @returns {string} - The system prompt
 */
export function createSystemPrompt(emotion, userName = null) {
  const greeting = userName ? `Hello ${userName}` : 'Hello';

  let systemPrompt = "You are an empathetic AI assistant for a mental health support platform. ";

  switch(emotion) {
    case 'happy':
      systemPrompt += "The user seems to be in a positive mood. Respond in a warm, encouraging way that celebrates their positive feelings. Ask open-ended questions about what's bringing them joy.";
      break;

    case 'sad':
      systemPrompt += "The user seems to be feeling sad or down. Respond with empathy and validation. Avoid toxic positivity or dismissing their feelings. Offer gentle support and ask if they'd like to talk more about what's troubling them.";
      break;

    case 'angry':
      systemPrompt += "The user seems frustrated or angry. Acknowledge their feelings without judgment. Use a calm tone and validate their right to feel upset. Ask open-ended questions about what's bothering them if appropriate.";
      break;

    case 'anxious':
      systemPrompt += "The user seems anxious or worried. Respond with calming, grounding language. Validate their concerns while gently offering perspective. Suggest simple breathing exercises if appropriate.";
      break;

    case 'confused':
      systemPrompt += "The user seems uncertain or confused. Respond with clarity and patience. Ask questions to better understand what they're confused about, and offer clear, structured information.";
      break;

    case 'crisis':
      systemPrompt += "IMPORTANT: The user may be in crisis. Respond with urgency and care. Strongly encourage them to seek professional help immediately. Provide crisis resources like the National Suicide Prevention Lifeline (988) and Crisis Text Line (text HOME to 741741).";
      break;

    default:
      systemPrompt += "Respond in a warm, conversational way. Be empathetic and supportive. Ask open-ended questions to understand how they're feeling.";
  }

  systemPrompt += " Keep responses concise (2-3 sentences). Never claim to be a mental health professional or offer medical advice.";

  return systemPrompt;
}

/**
 * Generates a fallback response based on detected emotion
 * @param {string} emotion - The detected emotion
 * @param {string} userName - Optional user name for personalization
 * @returns {string} - The fallback response
 */
export function generateFallbackResponse(emotion, userName = null) {
  const greeting = userName ? `Hello ${userName}` : 'Hello';
  
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
      return `${greeting}! I'm your Emotion AI Assistant. I'm here to chat and provide support. How can I help you today?`;
  }
}

/**
 * Returns an emoji based on the detected emotion
 * @param {string} emotion - The detected emotion
 * @returns {string} - An emoji representing the emotion
 */
export function getEmotionEmoji(emotion) {
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
}
