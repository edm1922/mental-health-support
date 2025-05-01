import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    // Get the request body
    const body = await request.json();
    const { email } = body;
    
    console.log('Redirect API called for email:', email);
    
    // Determine the redirect URL based on the email
    let redirectUrl = '/home'; // Default redirect
    
    if (email === 'counselor1@example.com') {
      console.log('Redirecting counselor to dashboard');
      redirectUrl = '/counselor/dashboard';
    } else if (email === 'edronmaguale635@gmail.com') {
      console.log('Redirecting admin to dashboard');
      redirectUrl = '/admin/dashboard';
    }
    
    console.log('Final redirect URL:', redirectUrl);
    
    // Return the redirect URL
    return NextResponse.json({ redirectUrl });
  } catch (error) {
    console.error('Error in redirect API:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
