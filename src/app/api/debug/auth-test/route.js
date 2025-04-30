import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ 
        authenticated: false,
        message: "Not authenticated"
      });
    }
    
    // Try to directly insert a test post
    const { data: post, error } = await supabase
      .from('discussion_posts')
      .insert({
        title: 'Test Post',
        content: 'This is a test post to verify authentication',
        user_id: session.user.id
      })
      .select('*')
      .single();
      
    if (error) {
      return NextResponse.json({
        authenticated: true,
        user_id: session.user.id,
        insert_success: false,
        error: error.message,
        details: error
      });
    }
    
    return NextResponse.json({
      authenticated: true,
      user_id: session.user.id,
      insert_success: true,
      post_id: post.id
    });
  } catch (error) {
    return NextResponse.json({
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
