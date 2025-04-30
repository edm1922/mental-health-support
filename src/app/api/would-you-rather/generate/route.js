import { NextResponse } from 'next/server';
import ModelClient, { isUnexpected } from "@azure-rest/ai-inference";
import { AzureKeyCredential } from "@azure/core-auth";

export const dynamic = 'force-dynamic';

// GitHub API configuration
const endpoint = "https://models.github.ai/inference";
const model = "deepseek/DeepSeek-V3-0324";

export async function GET() {
  try {
    // Get token from environment variables - check both GITHUB_TOKEN and DEEPSEEK_API_KEY
    const token = process.env.GITHUB_TOKEN || process.env.DEEPSEEK_API_KEY;

    console.log('Would You Rather API - GitHub Token available:', !!token, token ? `Length: ${token.length}` : 'Not found');
    console.log('Would You Rather API - GitHub Token value (first 10 chars):', token ? token.substring(0, 10) + '...' : 'N/A');

    // Check if token is available
    if (!token) {
      console.log('No API token found in environment variables (checked GITHUB_TOKEN and DEEPSEEK_API_KEY), using fallback questions');
      throw new Error('API token not configured');
    }

    console.log('API token found, attempting to use DeepSeek API');

    // Initialize the DeepSeek model client
    const client = ModelClient(
      endpoint,
      new AzureKeyCredential(token),
    );

    // System prompt for generating "Would You Rather" questions
    const systemPrompt = `You are an AI specialized in creating mental health and self-care themed "Would You Rather" questions.
    Generate a single "Would You Rather" question with two options that focus on mental health, self-care, social comfort, or emotional well-being.
    The question should be thoughtful, engaging, and reveal something about a person's coping style or preferences.
    Make the options balanced (neither should be obviously better than the other).

    Respond in JSON format only with this structure:
    {
      "question": "Would you rather...",
      "optionA": "First option",
      "optionB": "Second option",
      "insight": "A brief insight about what this choice might reveal about someone's preferences or coping style (1-2 sentences)"
    }`;

    // Send request to the model
    const response = await client.path("/chat/completions").post({
      body: {
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: "Generate a mental health themed Would You Rather question." }
        ],
        temperature: 0.8,
        top_p: 0.9,
        max_tokens: 300,
        model: model
      }
    });

    if (isUnexpected(response)) {
      throw response.body.error;
    }

    const aiResponse = response.body.choices[0].message.content;
    console.log('AI generated Would You Rather:', aiResponse);

    // Parse the JSON response
    try {
      const parsedResponse = JSON.parse(aiResponse);
      return NextResponse.json({
        success: true,
        ...parsedResponse,
        source: "ai"
      });
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      throw new Error('Invalid response format from AI');
    }
  } catch (error) {
    console.error('Error generating Would You Rather with DeepSeek:', error);

    // Log more detailed error information to help with debugging
    if (error.status) {
      console.error(`DeepSeek API HTTP Status: ${error.status}`);
    }
    if (error.body) {
      console.error('DeepSeek API Error Body:', error.body);
    }

    console.log('Falling back to predefined questions');

    // Fallback questions if the API fails
    const fallbackQuestions = [
      {
        question: "Would you rather...",
        optionA: "Journal your thoughts privately",
        optionB: "Talk to someone about your feelings",
        insight: "This reveals your preference for processing emotions internally vs externally."
      },
      {
        question: "Would you rather...",
        optionA: "Take a nature walk to clear your mind",
        optionB: "Watch your comfort show to relax",
        insight: "This shows whether you prefer active or passive activities for self-care."
      },
      {
        question: "Would you rather...",
        optionA: "Practice meditation for 10 minutes daily",
        optionB: "Exercise for 30 minutes three times a week",
        insight: "This indicates your preference for mental vs physical approaches to wellness."
      },
      {
        question: "Would you rather...",
        optionA: "Have deep conversations with one close friend",
        optionB: "Casual interactions with a larger group",
        insight: "This reveals your social energy preferences and how you build support networks."
      },
      {
        question: "Would you rather...",
        optionA: "Express your feelings through art or music",
        optionB: "Express your feelings through direct conversation",
        insight: "This shows your preferred emotional expression style - creative vs verbal."
      },
      {
        question: "Would you rather...",
        optionA: "Have a perfectly organized space",
        optionB: "Have a perfectly organized schedule",
        insight: "This indicates whether physical or temporal structure provides more comfort."
      },
      {
        question: "Would you rather...",
        optionA: "Spend a day completely alone to recharge",
        optionB: "Spend a day with loved ones to feel connected",
        insight: "This reveals how you restore your emotional energy - solitude vs connection."
      }
    ];

    const randomQuestion = fallbackQuestions[Math.floor(Math.random() * fallbackQuestions.length)];

    return NextResponse.json({
      success: true,
      ...randomQuestion,
      source: "fallback",
      error: error.message
    });
  }
}
