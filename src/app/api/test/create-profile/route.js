import { NextResponse } from 'next/server';
import { supabase } from '@/utils/supabaseClient';

export const dynamic = 'force-dynamic'; // This ensures the route is always dynamic

export async function GET() {
  try {
    console.log('Test create profile API called');

    // First check if the user_profiles table exists
    console.log('Checking if user_profiles table exists...');
    const { data: checkData, error: checkError } = await supabase
      .from('user_profiles')
      .select('id')
      .limit(1);
    
    console.log('Check result:', { data: checkData, error: checkError });
    
    // If the table doesn't exist, create it
    if (checkError && checkError.code === '42P01') {
      console.log('Table does not exist, creating it...');
      
      // Create the table using exec_sql
      const { data: createResult, error: createError } = await supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS public.user_profiles (
            id UUID PRIMARY KEY,
            display_name TEXT,
            bio TEXT,
            image_url TEXT,
            role TEXT DEFAULT 'user',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `
      });
      
      console.log('Create table result:', { data: createResult, error: createError });
      
      if (createError) {
        return NextResponse.json({
          success: false,
          error: createError,
          message: 'Failed to create user_profiles table'
        });
      }
    }
    
    // Generate a test UUID
    const testId = crypto.randomUUID();
    
    // Try to insert a test profile
    console.log('Inserting test profile with ID:', testId);
    const { data: insertData, error: insertError } = await supabase
      .from('user_profiles')
      .insert([
        {
          id: testId,
          display_name: 'Test User',
          role: 'user',
        }
      ])
      .select();
    
    console.log('Insert result:', { data: insertData, error: insertError });
    
    return NextResponse.json({
      success: !insertError,
      testId,
      data: insertData,
      error: insertError,
      message: insertError ? 'Failed to create test profile' : 'Test profile created successfully'
    });
  } catch (error) {
    console.error('Exception in test API:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      message: 'Exception occurred'
    }, { status: 500 });
  }
}
