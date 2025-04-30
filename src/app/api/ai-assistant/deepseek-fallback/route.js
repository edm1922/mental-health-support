import { NextResponse } from 'next/server';
import { detectEmotion, generateFallbackResponse } from '@/utils/emotionDetection';

export const dynamic = 'force-dynamic';

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

    console.log('Received message (fallback):', message);

    // Analyze the message for emotion
    const emotionAnalysis = detectEmotion(message);
    console.log('Emotion analysis (fallback):', emotionAnalysis);

    // Generate a response based on the detected emotion
    const response = generateFallbackResponse(emotionAnalysis.emotion);
    console.log('Generated response (fallback):', response);

    return NextResponse.json({
      success: true,
      response: response,
      emotion: emotionAnalysis.emotion,
      sentiment: emotionAnalysis.score,
      usingFallback: true
    });
  } catch (error) {
    console.error('Unexpected error in fallback:', error);
    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred',
      details: error.message
    }, { status: 500 });
  }
}
