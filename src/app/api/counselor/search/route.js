import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request) {
  try {
    // Get search parameters
    const { searchParams } = new URL(request.url);
    const searchTerm = searchParams.get('q') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    
    // Initialize Supabase client
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get the current session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ 
        success: false, 
        error: 'Authentication required' 
      }, { status: 401 });
    }
    
    // Calculate pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    
    // Build the query to search for counselors
    let query = supabase
      .from('user_profiles')
      .select('id, display_name, bio, specializations, availability_hours', { count: 'exact' })
      .eq('role', 'counselor');
    
    // Add search term filter if provided
    if (searchTerm) {
      query = query.or(`display_name.ilike.%${searchTerm}%,bio.ilike.%${searchTerm}%,specializations.ilike.%${searchTerm}%`);
    }
    
    // Add pagination
    query = query.range(from, to);
    
    // Execute the query
    const { data: counselors, count, error } = await query;
    
    if (error) {
      console.error('Error searching counselors:', error);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to search counselors' 
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      counselors: counselors || [],
      pagination: {
        page,
        pageSize,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize)
      }
    });
  } catch (error) {
    console.error('Unexpected error in counselor search API:', error);
    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred'
    }, { status: 500 });
  }
}
