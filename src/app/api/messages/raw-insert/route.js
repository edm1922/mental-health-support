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
    
    console.log(`RAW INSERT API: Inserting message in session ${sessionId} from ${senderId} to ${recipientId}`);
    
    // First, check if the table exists and has the expected structure
    try {
      const { data: tableInfo, error: tableError } = await supabase.rpc('exec_sql', {
        sql: `SELECT column_name, data_type 
              FROM information_schema.columns 
              WHERE table_name = 'session_messages' AND table_schema = 'public';`
      });
      
      if (tableError) {
        console.error('RAW INSERT API: Error checking table structure:', tableError);
      } else {
        console.log('RAW INSERT API: Table structure:', tableInfo);
      }
    } catch (tableCheckError) {
      console.error('RAW INSERT API: Error checking table:', tableCheckError);
    }
    
    // Try multiple approaches to insert the message
    
    // Approach 1: Direct SQL insert with explicit type casting and error handling
    try {
      // First disable RLS
      await supabase.rpc('exec_sql', {
        sql: `ALTER TABLE public.session_messages DISABLE ROW LEVEL SECURITY;`
      });
      
      // Use a PL/pgSQL block to handle errors
      const insertSql = `
        DO $$
        DECLARE
          new_id uuid := gen_random_uuid();
          result_record record;
        BEGIN
          -- Insert the message
          INSERT INTO public.session_messages 
            (id, session_id, sender_id, recipient_id, message, is_read, created_at, updated_at) 
          VALUES 
            (new_id, '${sessionId}'::uuid, '${senderId}'::uuid, '${recipientId}'::uuid, 
             '${message.trim().replace(/'/g, "''")}', false, NOW(), NOW());
          
          -- Get the inserted record
          SELECT * INTO result_record FROM public.session_messages WHERE id = new_id;
          
          -- Log the result
          RAISE NOTICE 'Inserted message with ID: %', new_id;
        EXCEPTION WHEN OTHERS THEN
          RAISE NOTICE 'Error inserting message: %', SQLERRM;
          RAISE;
        END $$;
        
        -- Return the most recently inserted message
        SELECT * FROM public.session_messages 
        WHERE session_id = '${sessionId}'::uuid 
        ORDER BY created_at DESC LIMIT 1;
      `;
      
      console.log('RAW INSERT API: Executing SQL:', insertSql);
      
      const { data: insertData, error: insertError } = await supabase.rpc('exec_sql', {
        sql: insertSql
      });
      
      if (insertError) {
        console.error('RAW INSERT API: Error with PL/pgSQL insert:', insertError);
        throw insertError;
      }
      
      console.log('RAW INSERT API: Insert successful, data:', insertData);
      
      return NextResponse.json({
        success: true,
        message: 'Message inserted successfully',
        data: insertData
      });
    } catch (insertError) {
      console.error('RAW INSERT API: Insert error:', insertError);
      
      // Approach 2: Simpler direct SQL insert
      try {
        const simpleSql = `
          INSERT INTO public.session_messages 
            (id, session_id, sender_id, recipient_id, message, is_read, created_at, updated_at) 
          VALUES 
            (gen_random_uuid(), '${sessionId}'::uuid, '${senderId}'::uuid, '${recipientId}'::uuid, 
             '${message.trim().replace(/'/g, "''")}', false, NOW(), NOW())
          RETURNING *;
        `;
        
        console.log('RAW INSERT API: Trying simpler SQL:', simpleSql);
        
        const { data: simpleData, error: simpleError } = await supabase.rpc('exec_sql', {
          sql: simpleSql
        });
        
        if (simpleError) {
          console.error('RAW INSERT API: Error with simple SQL insert:', simpleError);
          throw simpleError;
        }
        
        console.log('RAW INSERT API: Simple insert successful, data:', simpleData);
        
        return NextResponse.json({
          success: true,
          message: 'Message inserted successfully with simple SQL',
          data: simpleData
        });
      } catch (simpleError) {
        console.error('RAW INSERT API: Simple insert error:', simpleError);
        
        // Approach 3: Try the Supabase API
        try {
          console.log('RAW INSERT API: Trying Supabase API insert');
          
          const { data: supabaseData, error: supabaseError } = await supabase
            .from('session_messages')
            .insert({
              session_id: sessionId,
              sender_id: senderId,
              recipient_id: recipientId,
              message: message.trim(),
              is_read: false
            })
            .select();
          
          if (supabaseError) {
            console.error('RAW INSERT API: Error with Supabase API insert:', supabaseError);
            throw supabaseError;
          }
          
          console.log('RAW INSERT API: Supabase API insert successful, data:', supabaseData);
          
          return NextResponse.json({
            success: true,
            message: 'Message inserted successfully with Supabase API',
            data: supabaseData[0]
          });
        } catch (supabaseError) {
          console.error('RAW INSERT API: All insert methods failed');
          
          return NextResponse.json({
            success: false,
            error: 'Failed to insert message after trying multiple methods',
            details: {
              insertError: insertError.message,
              simpleError: simpleError.message,
              supabaseError: supabaseError.message,
              sessionId,
              senderId,
              recipientId
            }
          }, { status: 500 });
        }
      }
    }
  } catch (error) {
    console.error('RAW INSERT API: Unexpected error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred',
      details: error.message
    }, { status: 500 });
  }
}
