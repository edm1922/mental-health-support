import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    // Initialize Supabase client
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Get message data from request body
    const { sessionId, message, senderId, recipientId } = await request.json();
    
    if (!sessionId || !message || !senderId || !recipientId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Session ID, message, sender ID, and recipient ID are all required' 
      }, { status: 400 });
    }
    
    console.log(`SIMPLE INSERT API: Inserting message in session ${sessionId}`);
    console.log(`SIMPLE INSERT API: From ${senderId} to ${recipientId}`);
    console.log(`SIMPLE INSERT API: Message: ${message}`);
    
    // Insert the message using the Supabase API
    const { data, error } = await supabase
      .from('session_messages')
      .insert({
        session_id: sessionId,
        sender_id: senderId,
        recipient_id: recipientId,
        message: message.trim(),
        is_read: false
      })
      .select();
    
    if (error) {
      console.error('SIMPLE INSERT API: Error inserting message:', error);
      
      // Try with direct SQL as a fallback
      try {
        console.log('SIMPLE INSERT API: Trying direct SQL insert');
        
        const sqlQuery = `
          INSERT INTO public.session_messages 
            (session_id, sender_id, recipient_id, message, is_read) 
          VALUES 
            ('${sessionId}', '${senderId}', '${recipientId}', '${message.trim().replace(/'/g, "''")}', false)
          RETURNING *;
        `;
        
        const { data: sqlData, error: sqlError } = await supabase.rpc('exec_sql', {
          sql: sqlQuery
        });
        
        if (sqlError) {
          console.error('SIMPLE INSERT API: SQL insert error:', sqlError);
          throw sqlError;
        }
        
        console.log('SIMPLE INSERT API: SQL insert successful:', sqlData);
        
        return NextResponse.json({
          success: true,
          message: 'Message inserted successfully via SQL',
          data: sqlData
        });
      } catch (sqlError) {
        return NextResponse.json({
          success: false,
          error: 'Failed to insert message',
          details: {
            originalError: error.message,
            sqlError: sqlError.message
          }
        }, { status: 500 });
      }
    }
    
    console.log('SIMPLE INSERT API: Message inserted successfully:', data);
    
    return NextResponse.json({
      success: true,
      message: 'Message inserted successfully',
      data: data[0]
    });
  } catch (error) {
    console.error('SIMPLE INSERT API: Unexpected error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred',
      details: error.message
    }, { status: 500 });
  }
}
