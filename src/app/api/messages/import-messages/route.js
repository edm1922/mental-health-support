import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

// Sample messages to import
const sampleMessages = [
  {
    "id": "83cdfc5c-4f9f-4816-a838-e00b6ddd255e",
    "session_id": "f19de89f-506a-4207-aa21-f09bda8d0dfb",
    "sender_id": "1ccdfb9d-df48-4250-ba89-68c181b8c012",
    "recipient_id": "4fd19577-3876-4087-b18b-51a7b194460a",
    "message": "hello?",
    "is_read": false,
    "created_at": "2025-04-20 06:47:39.655405+00",
    "updated_at": "2025-04-20 06:47:39.655405+00"
  },
  {
    "id": "dca19555-ae9f-4ce2-9772-5cf3b7ec3d69",
    "session_id": "008d0283-3b83-489e-aeb4-6eaa0217c3b0",
    "sender_id": "e0907524-159d-4d4a-a99b-34453fc402fa",
    "recipient_id": "9ad6c313-9439-481c-b0c0-0388742db00d",
    "message": "This is a test message",
    "is_read": false,
    "created_at": "2025-04-21 02:25:37.292982+00",
    "updated_at": "2025-04-21 02:25:37.292982+00"
  },
  {
    "id": "6809ae1c-1117-48d2-ab6b-0df5d392eb95",
    "session_id": "008d0283-3b83-489e-aeb4-6eaa0217c3b0",
    "sender_id": "9ad6c313-9439-481c-b0c0-0388742db00d",
    "recipient_id": "e0907524-159d-4d4a-a99b-34453fc402fa",
    "message": "This is a reply to your message",
    "is_read": false,
    "created_at": "2025-04-21 02:25:53.391988+00",
    "updated_at": "2025-04-21 02:25:53.391988+00"
  },
  {
    "id": "4a75ec78-4b4b-4ced-bcbb-cfeffedc6ea7",
    "session_id": "008d0283-3b83-489e-aeb4-6eaa0217c3b0",
    "sender_id": "e0907524-159d-4d4a-a99b-34453fc402fa",
    "recipient_id": "9ad6c313-9439-481c-b0c0-0388742db00d",
    "message": "Thanks for your reply!",
    "is_read": false,
    "created_at": "2025-04-21 02:25:53.391988+00",
    "updated_at": "2025-04-21 02:25:53.391988+00"
  }
];

export async function POST(request) {
  try {
    // Initialize Supabase client
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    console.log('IMPORT MESSAGES: Starting message import');
    
    // First check if the table exists
    const checkSql = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'session_messages'
      );
    `;
    
    const { data: tableExists, error: checkError } = await supabase.rpc('exec_sql', {
      sql: checkSql
    });
    
    if (checkError) {
      console.error('IMPORT MESSAGES: Error checking if table exists:', checkError);
      return NextResponse.json({
        success: false,
        error: 'Error checking if table exists',
        details: checkError.message
      }, { status: 500 });
    }
    
    console.log('IMPORT MESSAGES: Table exists check result:', tableExists);
    
    // If table doesn't exist, create it
    if (!tableExists || !tableExists[0] || !tableExists[0].exists) {
      console.log('IMPORT MESSAGES: Table does not exist, creating it');
      
      // Create the table
      const createSql = `
        CREATE TABLE public.session_messages (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          session_id uuid NOT NULL,
          sender_id uuid NOT NULL,
          recipient_id uuid NOT NULL,
          message text NOT NULL,
          is_read boolean NOT NULL DEFAULT false,
          created_at timestamp with time zone NOT NULL DEFAULT now(),
          updated_at timestamp with time zone NOT NULL DEFAULT now()
        );
        
        ALTER TABLE public.session_messages DISABLE ROW LEVEL SECURITY;
      `;
      
      const { error: createError } = await supabase.rpc('exec_sql', {
        sql: createSql
      });
      
      if (createError) {
        console.error('IMPORT MESSAGES: Error creating table:', createError);
        return NextResponse.json({
          success: false,
          error: 'Error creating table',
          details: createError.message
        }, { status: 500 });
      }
      
      console.log('IMPORT MESSAGES: Table created successfully');
    }
    
    // Import the messages
    const results = [];
    const errors = [];
    
    for (const message of sampleMessages) {
      // Check if the message already exists
      const checkMessageSql = `
        SELECT EXISTS (
          SELECT FROM public.session_messages 
          WHERE id = '${message.id}'::uuid
        );
      `;
      
      const { data: messageExists, error: messageCheckError } = await supabase.rpc('exec_sql', {
        sql: checkMessageSql
      });
      
      if (messageCheckError) {
        console.error('IMPORT MESSAGES: Error checking if message exists:', messageCheckError);
        errors.push({
          message: message.id,
          error: messageCheckError.message
        });
        continue;
      }
      
      // Skip if message already exists
      if (messageExists && messageExists[0] && messageExists[0].exists) {
        console.log(`IMPORT MESSAGES: Message ${message.id} already exists, skipping`);
        results.push({
          id: message.id,
          status: 'skipped',
          reason: 'already exists'
        });
        continue;
      }
      
      // Insert the message
      const insertSql = `
        INSERT INTO public.session_messages (
          id, session_id, sender_id, recipient_id, message, is_read, created_at, updated_at
        ) VALUES (
          '${message.id}'::uuid,
          '${message.session_id}'::uuid,
          '${message.sender_id}'::uuid,
          '${message.recipient_id}'::uuid,
          '${message.message.replace(/'/g, "''")}',
          ${message.is_read},
          '${message.created_at}'::timestamp with time zone,
          '${message.updated_at}'::timestamp with time zone
        );
      `;
      
      const { error: insertError } = await supabase.rpc('exec_sql', {
        sql: insertSql
      });
      
      if (insertError) {
        console.error(`IMPORT MESSAGES: Error inserting message ${message.id}:`, insertError);
        errors.push({
          message: message.id,
          error: insertError.message
        });
      } else {
        console.log(`IMPORT MESSAGES: Message ${message.id} inserted successfully`);
        results.push({
          id: message.id,
          status: 'inserted',
          session_id: message.session_id
        });
      }
    }
    
    // Count total messages in the table
    const countSql = `
      SELECT COUNT(*) FROM public.session_messages;
    `;
    
    const { data: countData, error: countError } = await supabase.rpc('exec_sql', {
      sql: countSql
    });
    
    if (countError) {
      console.error('IMPORT MESSAGES: Error counting messages:', countError);
    } else {
      console.log('IMPORT MESSAGES: Total message count:', countData);
    }
    
    return NextResponse.json({
      success: true,
      message: 'Messages imported',
      results: results,
      errors: errors,
      totalMessages: countData && countData[0] ? countData[0].count : 'unknown'
    });
  } catch (error) {
    console.error('IMPORT MESSAGES: Unexpected error:', error);
    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred',
      details: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
