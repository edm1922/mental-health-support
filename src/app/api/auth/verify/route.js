import { NextResponse } from 'next/server';
import { supabase } from '@/utils/supabaseClient';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    // Get the session if available
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      // Try to refresh the session
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();

      if (refreshError || !refreshData.session) {
        return NextResponse.json({
          authenticated: false,
          message: 'No active session found',
          error: refreshError?.message
        });
      }

      // Session refreshed successfully
      return NextResponse.json({
        authenticated: true,
        user: {
          id: refreshData.session.user.id,
          email: refreshData.session.user.email
        },
        message: 'Session refreshed successfully'
      });
    }

    // Session exists
    return NextResponse.json({
      authenticated: true,
      user: {
        id: session.user.id,
        email: session.user.email
      }
    });
  } catch (error) {
    console.error('Error in auth verify API:', error);
    return NextResponse.json({
      authenticated: false,
      error: error.message
    });
  }
}
