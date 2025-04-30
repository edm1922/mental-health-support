import { NextResponse } from 'next/server';
import ModelClient, { isUnexpected } from "@azure-rest/ai-inference";
import { AzureKeyCredential } from "@azure/core-auth";

export const dynamic = 'force-dynamic';

// GitHub API configuration
const token = process.env.GITHUB_TOKEN;
console.log('Quotes API - GitHub Token available:', !!token, token ? `Length: ${token.length}` : 'Not found');
console.log('Quotes API - GitHub Token value (first 10 chars):', token ? token.substring(0, 10) + '...' : 'N/A');
const endpoint = "https://models.github.ai/inference";
const model = "deepseek/DeepSeek-V3-0324";

export async function GET() {
  try {
    // Check if token is available
    if (!token) {
      console.log('GITHUB_TOKEN not found in environment variables, using fallback quotes');
      throw new Error('API token not configured');
    }

    // Initialize the DeepSeek model client
    const client = ModelClient(
      endpoint,
      new AzureKeyCredential(token),
    );

    // System prompt for generating inspirational quotes
    const systemPrompt = `You are an AI specialized in creating inspirational and motivational quotes for mental health and well-being.
    Generate a single, original, thoughtful quote that can inspire someone who might be feeling down or anxious.
    The quote should be concise (under 100 characters), uplifting, and meaningful.
    Make it sound like a professional therapist or mental health expert would say it.
    Respond with ONLY the quote text followed by the author "DeepSeek AI" in the format: "Quote text" - DeepSeek AI`;

    // Send request to the model
    const response = await client.path("/chat/completions").post({
      body: {
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: "Generate an inspirational quote for mental health and well-being." }
        ],
        temperature: 0.8,
        top_p: 0.9,
        max_tokens: 200,
        model: model
      }
    });

    if (isUnexpected(response)) {
      throw response.body.error;
    }

    const aiResponse = response.body.choices[0].message.content;
    console.log('AI generated quote:', aiResponse);

    // Parse the quote and author from the response
    let quote, author;

    // Try to extract quote and author using regex
    const quoteMatch = aiResponse.match(/"([^"]+)"\s*-\s*(.+)/);
    if (quoteMatch) {
      quote = quoteMatch[1];
      author = quoteMatch[2];
    } else {
      // Fallback: use the whole response as the quote
      quote = aiResponse;
      author = "DeepSeek AI";
    }

    return NextResponse.json({
      success: true,
      quote,
      author,
      source: "ai"
    });
  } catch (error) {
    console.error('Error generating quote with DeepSeek:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));

    // Log specific error information if available
    if (error.status) {
      console.error(`DeepSeek API HTTP Status: ${error.status}`);
    }
    if (error.body) {
      console.error('DeepSeek API Error Body:', error.body);
    }

    // Fallback quotes if the API fails
    const fallbackQuotes = [
      { quote: "Your mental health is a priority. Your happiness is essential.", author: "DeepSeek AI" },
      { quote: "Small steps still move you forward. Be proud of your progress.", author: "DeepSeek AI" },
      { quote: "You are stronger than you think and braver than you believe.", author: "DeepSeek AI" },
      { quote: "It's okay to not be okay, and it's okay to ask for help.", author: "DeepSeek AI" },
      { quote: "Today is a new beginning. Embrace the possibilities.", author: "DeepSeek AI" },
      { quote: "You've survived 100% of your worst days. You're doing better than you think.", author: "DeepSeek AI" },
      { quote: "Every storm runs out of rain. Keep going.", author: "DeepSeek AI" },
      { quote: "Healing is not linear – give yourself grace.", author: "DeepSeek AI" }
    ];

    const randomQuote = fallbackQuotes[Math.floor(Math.random() * fallbackQuotes.length)];

    return NextResponse.json({
      success: true,
      quote: randomQuote.quote,
      author: randomQuote.author,
      source: "fallback",
      error: error.message
    });
  }
}
