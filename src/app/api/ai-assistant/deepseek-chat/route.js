import { NextResponse } from 'next/server';
import ModelClient, { isUnexpected } from "@azure-rest/ai-inference";
import { AzureKeyCredential } from "@azure/core-auth";
import { detectEmotion, createSystemPrompt, generateFallbackResponse } from '@/utils/emotionDetection';

export const dynamic = 'force-dynamic';

// GitHub API configuration
const token = process.env.GITHUB_TOKEN;
console.log('GitHub Token available:', !!token, token ? `Length: ${token.length}` : 'Not found');
console.log('GitHub Token value (first 10 chars):', token ? token.substring(0, 10) + '...' : 'N/A');
const endpoint = "https://models.github.ai/inference";
const model = "deepseek/DeepSeek-V3-0324";

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

    // Create system prompt based on detected emotion
    const systemPrompt = createSystemPrompt(emotionAnalysis.emotion);
    console.log('System prompt:', systemPrompt);

    try {
      // Check if token is available
      if (!token) {
        console.error('GitHub Token is not available in environment variables');
        throw new Error('API token not configured');
      }

      console.log('Initializing DeepSeek model client with endpoint:', endpoint);

      // Initialize the DeepSeek model client
      const client = ModelClient(
        endpoint,
        new AzureKeyCredential(token),
      );

      console.log('Sending request to DeepSeek model');

      // Send request to the model
      const response = await client.path("/chat/completions").post({
        body: {
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: message }
          ],
          temperature: 0.7,
          top_p: 0.9,
          max_tokens: 500,
          model: model
        }
      });

      console.log('Response received from DeepSeek model');

      if (isUnexpected(response)) {
        console.error('Unexpected response from DeepSeek:', response.body);
        throw response.body.error;
      }

      const aiResponse = response.body.choices[0].message.content;
      console.log('AI response:', aiResponse);

      return NextResponse.json({
        success: true,
        response: aiResponse,
        emotion: emotionAnalysis.emotion,
        sentiment: emotionAnalysis.score
      });
    } catch (modelError) {
      console.error('Error calling DeepSeek model:', modelError);
      console.error('Error details:', JSON.stringify(modelError, null, 2));

      // Log specific error information if available
      if (modelError.status) {
        console.error(`DeepSeek API HTTP Status: ${modelError.status}`);
      }
      if (modelError.body) {
        console.error('DeepSeek API Error Body:', modelError.body);
      }

      // Fallback to rule-based responses if the model fails
      const fallbackResponse = generateFallbackResponse(emotionAnalysis.emotion);

      return NextResponse.json({
        success: true,
        response: fallbackResponse,
        emotion: emotionAnalysis.emotion,
        sentiment: emotionAnalysis.score,
        usingFallback: true
      });
    }
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred',
      details: error.message
    }, { status: 500 });
  }
}
