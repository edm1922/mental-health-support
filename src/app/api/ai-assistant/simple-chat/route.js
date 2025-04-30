import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Simple emotion detection function
function detectEmotion(message) {
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

// Generate response based on emotion
function generateResponse(message, emotion) {
  switch(emotion) {
    case 'happy':
      return "It's wonderful to hear you're feeling positive! That's something to celebrate. What's bringing you joy today? I'd love to hear more about what's going well for you.";
    
    case 'sad':
      return "I notice you might be feeling down right now. That's completely okay - we all have moments like this. Would you like to talk more about what's troubling you? Sometimes sharing can help lighten the burden.";
    
    case 'angry':
      return "I can sense you might be feeling frustrated or upset. Those feelings are valid and important. Would it help to talk through what's bothering you? I'm here to listen without judgment.";
    
    case 'anxious':
      return "It sounds like you might be experiencing some worry or anxiety. That's a natural response to stress. Would it help to take a few deep breaths together? Remember that these feelings will pass, and you're not alone in this.";
    
    case 'confused':
      return "It seems like you might be feeling a bit uncertain right now. That's completely understandable. Sometimes things can be overwhelming or unclear. Would it help to break down what's on your mind?";
    
    case 'neutral':
      return "How are you feeling today? I'm your Emotion AI Assistant, here to chat, offer support, or just listen. What's on your mind?";
    
    case 'crisis':
      return "I'm really concerned about what you've shared. These thoughts are serious, and it's important you speak with a mental health professional right away. Please call the National Suicide Prevention Lifeline at 988 (or 1-800-273-8255), text HOME to 741741 to reach the Crisis Text Line, or go to your nearest emergency room. You matter, and help is available.";
    
    default:
      return "I'm your Emotion AI Assistant. I'm here to chat and provide support. How can I help you today?";
  }
}

export async function POST(request) {
  try {
    // Get the request body
    const { message } = await request.json();
    
    // Validate required fields
    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }
    
    console.log('Received message:', message);
    
    // Analyze the message for emotion
    const emotionAnalysis = detectEmotion(message);
    console.log('Emotion analysis:', emotionAnalysis);
    
    // Generate a response based on the detected emotion
    const response = generateResponse(message, emotionAnalysis.emotion);
    console.log('Generated response:', response);
    
    return NextResponse.json({
      success: true,
      response: response,
      emotion: emotionAnalysis.emotion,
      sentiment: emotionAnalysis.score
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred',
      details: error.message
    }, { status: 500 });
  }
}
