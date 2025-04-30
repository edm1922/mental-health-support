import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
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
    
    // Check if user is an admin
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();
    
    if (!userProfile || userProfile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }
    
    // Get insights from the database
    const { data: conversationData, error: conversationError } = await supabase
      .from('ai_assistant_conversations')
      .select(`
        id,
        user_id,
        message,
        response,
        emotion_detected,
        sentiment_score,
        created_at,
        user_profiles:user_id (display_name)
      `)
      .order('created_at', { ascending: false })
      .limit(100);
    
    if (conversationError) {
      console.error('Error fetching conversation data:', conversationError);
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch conversation data',
        details: conversationError.message
      }, { status: 500 });
    }
    
    // Calculate emotion distribution
    const emotionCounts = {};
    let totalSentiment = 0;
    let conversationCount = 0;
    
    conversationData.forEach(conversation => {
      const emotion = conversation.emotion_detected || 'unknown';
      emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
      
      if (conversation.sentiment_score !== null) {
        totalSentiment += conversation.sentiment_score;
        conversationCount++;
      }
    });
    
    // Calculate average sentiment
    const averageSentiment = conversationCount > 0 
      ? (totalSentiment / conversationCount).toFixed(2) 
      : 0;
    
    // Get user engagement stats
    const { data: userStats, error: userStatsError } = await supabase
      .from('ai_assistant_conversations')
      .select('user_id, count(*)')
      .group('user_id')
      .order('count', { ascending: false });
    
    if (userStatsError) {
      console.error('Error fetching user stats:', userStatsError);
      // Continue anyway - we'll just return partial data
    }
    
    // Get total users who have used the assistant
    const totalUsers = userStats?.length || 0;
    
    // Get users with potentially concerning sentiment
    const { data: concerningUsers, error: concerningError } = await supabase
      .from('ai_assistant_conversations')
      .select(`
        user_id,
        user_profiles:user_id (display_name),
        avg(sentiment_score) as avg_sentiment
      `)
      .group('user_id, user_profiles.display_name')
      .order('avg_sentiment', { ascending: true })
      .limit(5);
    
    if (concerningError) {
      console.error('Error fetching concerning users:', concerningError);
      // Continue anyway - we'll just return partial data
    }
    
    return NextResponse.json({
      success: true,
      insights: {
        totalConversations: conversationData.length,
        emotionDistribution: emotionCounts,
        averageSentiment,
        totalUsers,
        recentConversations: conversationData.slice(0, 10),
        concerningUsers: concerningUsers || []
      }
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
