import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    // Get the request body
    const body = await request.json();
    const { email, password } = body;
    
    console.log('Direct sign-in API called for email:', email);
    
    // Initialize Supabase client
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Sign in the user
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      console.error('Sign-in error:', error);
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    
    if (!data.user) {
      console.error('No user returned from sign-in');
      return NextResponse.json({ error: 'No user returned from sign-in' }, { status: 401 });
    }
    
    console.log('Sign-in successful, user ID:', data.user.id);
    
    // Determine the redirect URL based on the email
    let redirectUrl = '/home'; // Default redirect
    
    if (email === 'counselor1@example.com') {
      console.log('Counselor account detected, redirecting to counselor dashboard');
      redirectUrl = '/counselor/dashboard';
    } else if (email === 'edronmaguale635@gmail.com') {
      console.log('Admin account detected, redirecting to admin dashboard');
      redirectUrl = '/admin/dashboard';
    }
    
    console.log('Final redirect URL:', redirectUrl);
    
    // Return the redirect URL and session
    return NextResponse.json({ 
      redirectUrl,
      session: data.session
    });
  } catch (error) {
    console.error('Error in direct sign-in API:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
