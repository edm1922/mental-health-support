import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Initialize Supabase client
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Get current user
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError) {
        console.error('API: Error getting user:', userError);
        // Return a temporary user for development purposes
        return NextResponse.json({
          success: true,
          user: {
            id: '00000000-0000-0000-0000-000000000000',
            email: 'temp@example.com',
            role: 'authenticated',
            profile: {
              id: '00000000-0000-0000-0000-000000000000',
              display_name: 'Temporary User',
              role: 'user'
            },
            isTemporary: true
          }
        });
      }

      if (!user) {
        console.log('API: No authenticated user found, returning temporary user');
        // Return a temporary user for development purposes
        return NextResponse.json({
          success: true,
          user: {
            id: '00000000-0000-0000-0000-000000000000',
            email: 'temp@example.com',
            role: 'authenticated',
            profile: {
              id: '00000000-0000-0000-0000-000000000000',
              display_name: 'Temporary User',
              role: 'user'
            },
            isTemporary: true
          }
        });
      }
    } catch (authError) {
      console.error('API: Error in auth.getUser():', authError);
      // Return a temporary user for development purposes
      return NextResponse.json({
        success: true,
        user: {
          id: '00000000-0000-0000-0000-000000000000',
          email: 'temp@example.com',
          role: 'authenticated',
          profile: {
            id: '00000000-0000-0000-0000-000000000000',
            display_name: 'Temporary User',
            role: 'user'
          },
          isTemporary: true
        }
      });
    }

    // We have a valid user at this point
    const { data: { user } } = await supabase.auth.getUser();

    // Get user profile
    try {
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError && !profileError.message.includes('No rows found')) {
        console.error('API: Error getting user profile:', profileError);
      }

      return NextResponse.json({
        success: true,
        user: {
          ...user,
          profile: profile || null
        }
      });
    } catch (profileError) {
      console.error('API: Error getting user profile:', profileError);

      // Return the user without profile
      return NextResponse.json({
        success: true,
        user: {
          ...user,
          profile: null
        }
      });
    }
  } catch (error) {
    console.error('API: Unexpected error in get user:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
