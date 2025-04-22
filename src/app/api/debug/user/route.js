import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    console.log('Debug user API called');
    
    // Get the current user
    const { data: authData, error: authError } = await supabase.rpc('get_current_user');
    
    if (authError) {
      console.error('Error getting current user:', authError);
      return NextResponse.json({ error: authError.message }, { status: 500 });
    }
    
    // Get auth.uid() directly
    const { data: uidData, error: uidError } = await supabase.rpc('exec_sql', {
      sql: 'SELECT auth.uid() as uid;'
    });
    
    // Get user profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(10);
    
    return NextResponse.json({
      currentUser: authData,
      uid: uidData,
      profiles: profiles,
      uidError: uidError ? uidError.message : null,
      profilesError: profilesError ? profilesError.message : null
    });
  } catch (error) {
    console.error('Error in debug user API:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
