import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

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
function generateResponse(message, emotion, userName) {
  const greeting = userName ? `Hi ${userName}` : 'Hi there';

  switch(emotion) {
    case 'happy':
      return `${greeting}! It's wonderful to hear you're feeling positive! That's something to celebrate. What's bringing you joy today? I'd love to hear more about what's going well for you.`;

    case 'sad':
      return `${greeting}, I notice you might be feeling down right now. That's completely okay - we all have moments like this. Would you like to talk more about what's troubling you? Sometimes sharing can help lighten the burden.`;

    case 'angry':
      return `${greeting}, I can sense you might be feeling frustrated or upset. Those feelings are valid and important. Would it help to talk through what's bothering you? I'm here to listen without judgment.`;

    case 'anxious':
      return `${greeting}, it sounds like you might be experiencing some worry or anxiety. That's a natural response to stress. Would it help to take a few deep breaths together? Remember that these feelings will pass, and you're not alone in this.`;

    case 'confused':
      return `${greeting}, it seems like you might be feeling a bit uncertain right now. That's completely understandable. Sometimes things can be overwhelming or unclear. Would it help to break down what's on your mind?`;

    case 'neutral':
      return `${greeting}! How are you feeling today? I'm your Emotion AI Assistant, here to chat, offer support, or just listen. What's on your mind?`;

    case 'crisis':
      return `I'm really concerned about what you've shared. These thoughts are serious, and it's important you speak with a mental health professional right away. Please call the National Suicide Prevention Lifeline at 988 (or 1-800-273-8255), text HOME to 741741 to reach the Crisis Text Line, or go to your nearest emergency room. You matter, and help is available.`;

    default:
      return `${greeting}! I'm your Emotion AI Assistant. I'm here to chat and provide support. How can I help you today?`;
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

    // Initialize Supabase client
    const supabase = createRouteHandlerClient({ cookies });

    // Get the current user
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Get user's display name
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('display_name')
      .eq('id', userId)
      .single();

    const userName = userProfile?.display_name || null;

    // Analyze the message for emotion
    const emotionAnalysis = detectEmotion(message);

    // Generate a response based on the detected emotion
    const response = generateResponse(message, emotionAnalysis.emotion, userName);

    // Ensure the ai_assistant_conversations table exists
    try {
      // Try the direct table creation endpoint first
      const tableResponse = await fetch(new URL('/api/ai-assistant/create-table-direct', request.url).toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!tableResponse.ok) {
        console.error('Direct table creation API returned error:', await tableResponse.text());

        // Try the original table creation endpoint as fallback
        try {
          const fallbackResponse = await fetch(new URL('/api/ai-assistant/create-table', request.url).toString(), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            }
          });

          if (!fallbackResponse.ok) {
            console.error('Fallback table creation API also failed:', await fallbackResponse.text());
          }
        } catch (fallbackError) {
          console.error('Error with fallback table creation:', fallbackError);
        }
      }
    } catch (tableError) {
      console.error('Error ensuring table exists:', tableError);
      // Continue anyway - the table might already exist
    }

    // Try to store the conversation in the database
    try {
      // First check if the table exists
      const { count, error: countError } = await supabase
        .from('information_schema.tables')
        .select('table_name', { count: 'exact', head: true })
        .eq('table_name', 'ai_assistant_conversations')
        .eq('table_schema', 'public');

      if (countError) {
        console.error('Error checking if table exists:', countError);
        // Table might not exist, let's create it directly
        const createTableSql = `
          CREATE TABLE IF NOT EXISTS public.ai_assistant_conversations (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL,
            message TEXT NOT NULL,
            response TEXT NOT NULL,
            emotion_detected TEXT,
            sentiment_score FLOAT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );

          -- Disable RLS initially for easier development
          ALTER TABLE public.ai_assistant_conversations DISABLE ROW LEVEL SECURITY;
        `;

        const { error: createError } = await supabase.rpc('exec_sql', {
          sql: createTableSql
        });

        if (createError) {
          console.error('Error creating table directly:', createError);
        }
      }

      // Now try to insert the conversation
      const { data: conversationData, error: conversationError } = await supabase
        .from('ai_assistant_conversations')
        .insert({
          user_id: userId,
          message: message,
          response: response,
          emotion_detected: emotionAnalysis.emotion,
          sentiment_score: emotionAnalysis.score
        })
        .select()
        .single();

      if (conversationError) {
        console.error('Error storing conversation:', conversationError);
        // Try a direct SQL insert as a fallback
        const insertSql = `
          INSERT INTO public.ai_assistant_conversations
            (id, user_id, message, response, emotion_detected, sentiment_score, created_at, updated_at)
          VALUES
            (gen_random_uuid(), '${userId}',
             '${message.replace(/'/g, "''")}',
             '${response.replace(/'/g, "''")}',
             '${emotionAnalysis.emotion}',
             ${emotionAnalysis.score},
             NOW(), NOW());
        `;

        const { error: insertError } = await supabase.rpc('exec_sql', {
          sql: insertSql
        });

        if (insertError) {
          console.error('Error with direct SQL insert:', insertError);
        }
      }
    } catch (dbError) {
      console.error('Database operation error:', dbError);
      // Continue anyway - we still want to return a response to the user
    }

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
