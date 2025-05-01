import { NextResponse } from 'next/server';
import { supabase } from '@/utils/supabaseClient';

export async function GET() {
  try {
    // Create counseling_sessions table if it doesn't exist
    const { error: sessionsError } = await supabase.rpc('create_counseling_sessions_if_not_exists');
    
    if (sessionsError) {
      // If the RPC function doesn't exist, create the table directly
      const { error: createSessionsError } = await supabase.query(`
        CREATE TABLE IF NOT EXISTS counseling_sessions (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          counselor_id UUID NOT NULL REFERENCES auth.users(id),
          client_id UUID NOT NULL REFERENCES auth.users(id),
          session_date TIMESTAMP WITH TIME ZONE NOT NULL,
          status TEXT NOT NULL DEFAULT 'upcoming',
          notes TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `);
      
      if (createSessionsError) {
        console.error('Error creating counseling_sessions table:', createSessionsError);
      }
    }
    
    // Create daily_check_ins table if it doesn't exist
    const { error: checkInsError } = await supabase.rpc('create_daily_check_ins_if_not_exists');
    
    if (checkInsError) {
      // If the RPC function doesn't exist, create the table directly
      const { error: createCheckInsError } = await supabase.query(`
        CREATE TABLE IF NOT EXISTS daily_check_ins (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID NOT NULL REFERENCES auth.users(id),
          mood_rating INTEGER NOT NULL,
          notes TEXT,
          sleep_hours NUMERIC,
          activities TEXT[],
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `);
      
      if (createCheckInsError) {
        console.error('Error creating daily_check_ins table:', createCheckInsError);
      }
    }
    
    // Create community_posts table if it doesn't exist
    const { error: postsError } = await supabase.rpc('create_community_posts_if_not_exists');
    
    if (postsError) {
      // If the RPC function doesn't exist, create the table directly
      const { error: createPostsError } = await supabase.query(`
        CREATE TABLE IF NOT EXISTS community_posts (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID NOT NULL REFERENCES auth.users(id),
          title TEXT NOT NULL,
          content TEXT NOT NULL,
          reply_count INTEGER DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `);
      
      if (createPostsError) {
        console.error('Error creating community_posts table:', createPostsError);
      }
    }
    
    // Insert sample data into counseling_sessions if empty
    const { data: existingSessions } = await supabase
      .from('counseling_sessions')
      .select('id')
      .limit(1);
    
    if (!existingSessions || existingSessions.length === 0) {
      // Get counselor user ID
      const { data: counselorData } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('role', 'counselor')
        .limit(1);
      
      // Get some regular users
      const { data: usersData } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('role', 'user')
        .limit(3);
      
      if (counselorData && counselorData.length > 0 && usersData && usersData.length > 0) {
        const counselorId = counselorData[0].id;
        
        // Insert sample sessions
        await supabase.from('counseling_sessions').insert([
          {
            counselor_id: counselorId,
            client_id: usersData[0]?.id || counselorId, // Fallback to counselor if no users
            session_date: new Date('2023-06-15').toISOString(),
            status: 'completed',
            notes: 'Initial consultation completed successfully.'
          },
          {
            counselor_id: counselorId,
            client_id: usersData[1]?.id || counselorId,
            session_date: new Date('2023-06-20').toISOString(),
            status: 'upcoming',
            notes: 'Follow-up session to discuss progress.'
          },
          {
            counselor_id: counselorId,
            client_id: usersData[2]?.id || counselorId,
            session_date: new Date('2023-06-25').toISOString(),
            status: 'upcoming',
            notes: 'Initial consultation to assess needs.'
          }
        ]);
      }
    }
    
    // Insert sample data into daily_check_ins if empty
    const { data: existingCheckIns } = await supabase
      .from('daily_check_ins')
      .select('id')
      .limit(1);
    
    if (!existingCheckIns || existingCheckIns.length === 0) {
      // Get some regular users
      const { data: usersData } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('role', 'user')
        .limit(2);
      
      if (usersData && usersData.length > 0) {
        // Insert sample check-ins
        await supabase.from('daily_check_ins').insert([
          {
            user_id: usersData[0]?.id,
            mood_rating: 3,
            notes: 'Feeling stressed about work deadlines.',
            sleep_hours: 6,
            activities: ['Work', 'Exercise']
          },
          {
            user_id: usersData[1]?.id || usersData[0]?.id,
            mood_rating: 7,
            notes: 'Had a good day, practiced meditation.',
            sleep_hours: 8,
            activities: ['Meditation', 'Reading']
          }
        ]);
      }
    }
    
    // Insert sample data into community_posts if empty
    const { data: existingPosts } = await supabase
      .from('community_posts')
      .select('id')
      .limit(1);
    
    if (!existingPosts || existingPosts.length === 0) {
      // Get counselor user ID
      const { data: counselorData } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('role', 'counselor')
        .limit(1);
      
      // Get a regular user
      const { data: userData } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('role', 'user')
        .limit(1);
      
      if (counselorData && counselorData.length > 0 && userData && userData.length > 0) {
        const counselorId = counselorData[0].id;
        const userId = userData[0].id;
        
        // Insert sample posts
        await supabase.from('community_posts').insert([
          {
            user_id: userId,
            title: 'Tips for managing anxiety during exams',
            content: 'I\'ve been struggling with exam anxiety. Any tips that have worked for you?',
            reply_count: 5
          },
          {
            user_id: counselorId,
            title: 'Mindfulness techniques for beginners',
            content: 'Here are some simple mindfulness techniques anyone can try to reduce stress and improve focus.',
            reply_count: 12
          }
        ]);
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Counselor tables and sample data created successfully' 
    });
  } catch (error) {
    console.error('Error setting up counselor tables:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
