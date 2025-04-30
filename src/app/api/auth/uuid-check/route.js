import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Initialize Supabase client with cookies
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    console.log('UUID auth check API called');
    
    // Call the Supabase function directly
    const { data, error } = await supabase.rpc('get_current_user');
    
    if (error) {
      console.error('Error calling get_current_user:', error);
      return NextResponse.json({
        authenticated: false,
        error: error.message
      });
    }
    
    console.log('UUID auth check result:', data);
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in UUID auth check:', error);
    return NextResponse.json({
      authenticated: false,
      error: error.message
    }, { status: 500 });
  }
}
