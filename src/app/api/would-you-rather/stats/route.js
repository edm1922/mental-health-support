import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

// Create a Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function GET(request) {
  try {
    // Get the question ID from the query parameters
    const { searchParams } = new URL(request.url);
    const questionId = searchParams.get('questionId');
    
    if (!questionId) {
      return NextResponse.json({
        success: false,
        error: 'Question ID is required'
      }, { status: 400 });
    }
    
    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get the count of responses for each option
    const { data, error } = await supabase
      .from('would_you_rather_responses')
      .select('selected_option, count')
      .eq('question_id', questionId)
      .group('selected_option');
    
    if (error) {
      console.error('Error fetching response stats:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch response statistics'
      }, { status: 500 });
    }
    
    // Format the response
    const stats = {
      optionA: 0,
      optionB: 0
    };
    
    // Update stats with actual counts
    data.forEach(item => {
      if (item.selected_option === 'optionA' || item.selected_option === 'optionB') {
        stats[item.selected_option] = parseInt(item.count);
      }
    });
    
    return NextResponse.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error in Would You Rather stats API:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}
