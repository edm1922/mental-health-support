import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    // Initialize Supabase client
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Get the session ID from the request
    const { sessionId } = await request.json();
    
    if (!sessionId) {
      return NextResponse.json({
        success: false,
        error: 'Session ID is required'
      }, { status: 400 });
    }
    
    console.log('FIX COUNSELING SESSION: Starting fix for session', sessionId);
    
    // First, check the structure of the counseling_sessions table
    const { data: tableStructure, error: structureError } = await supabase.rpc('exec_sql', {
      sql: `SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_schema = 'public'
            AND table_name = 'counseling_sessions';`
    });
    
    if (structureError) {
      console.error('FIX COUNSELING SESSION: Error checking table structure:', structureError);
      return NextResponse.json({
        success: false,
        error: 'Error checking table structure',
        details: structureError.message
      }, { status: 500 });
    }
    
    console.log('FIX COUNSELING SESSION: Table structure:', tableStructure);
    
    // Create test users first
    const senderSql = `
      INSERT INTO public.user_profiles (
        id, 
        display_name, 
        role, 
        created_at, 
        updated_at
      ) VALUES (
        '00000000-0000-0000-0000-000000000000'::uuid, 
        'Test Sender', 
        'user', 
        now(), 
        now()
      ) 
      ON CONFLICT (id) DO UPDATE 
      SET display_name = 'Test Sender', updated_at = now()
      RETURNING *;
    `;
    
    const { data: sender, error: senderError } = await supabase.rpc('exec_sql', {
      sql: senderSql
    });
    
    if (senderError) {
      console.error('FIX COUNSELING SESSION: Error creating sender:', senderError);
    } else {
      console.log('FIX COUNSELING SESSION: Sender created or updated:', sender);
    }
    
    const recipientSql = `
      INSERT INTO public.user_profiles (
        id, 
        display_name, 
        role, 
        created_at, 
        updated_at
      ) VALUES (
        '11111111-1111-1111-1111-111111111111'::uuid, 
        'Test Recipient', 
        'counselor', 
        now(), 
        now()
      ) 
      ON CONFLICT (id) DO UPDATE 
      SET display_name = 'Test Recipient', updated_at = now()
      RETURNING *;
    `;
    
    const { data: recipient, error: recipientError } = await supabase.rpc('exec_sql', {
      sql: recipientSql
    });
    
    if (recipientError) {
      console.error('FIX COUNSELING SESSION: Error creating recipient:', recipientError);
    } else {
      console.log('FIX COUNSELING SESSION: Recipient created or updated:', recipient);
    }
    
    // Create or update the counseling session with all required fields
    const createSessionSql = `
      INSERT INTO public.counseling_sessions (
        id,
        counselor_id,
        patient_id,
        session_date,
        duration,
        status,
        created_at,
        updated_at,
        type
      ) VALUES (
        '${sessionId}'::uuid,
        '11111111-1111-1111-1111-111111111111'::uuid,
        '00000000-0000-0000-0000-000000000000'::uuid,
        NOW(),
        60,
        'active',
        NOW(),
        NOW(),
        'one_on_one'
      )
      ON CONFLICT (id) DO UPDATE
      SET 
        session_date = NOW(),
        updated_at = NOW()
      RETURNING *;
    `;
    
    const { data: createdSession, error: createSessionError } = await supabase.rpc('exec_sql', {
      sql: createSessionSql
    });
    
    if (createSessionError) {
      console.error('FIX COUNSELING SESSION: Error creating session:', createSessionError);
      
      // Try a more dynamic approach by building the SQL based on the table structure
      try {
        // Get the list of required columns (where is_nullable = 'NO' and no default value)
        const requiredColumns = tableStructure
          .filter(col => col.is_nullable === 'NO' && col.column_default === null)
          .map(col => col.column_name);
        
        console.log('FIX COUNSELING SESSION: Required columns:', requiredColumns);
        
        // Build a dynamic SQL statement with all required columns
        let dynamicColumns = ['id', 'counselor_id', 'patient_id'];
        let dynamicValues = [`'${sessionId}'::uuid`, `'11111111-1111-1111-1111-111111111111'::uuid`, `'00000000-0000-0000-0000-000000000000'::uuid`];
        
        // Add other required columns with default values
        if (requiredColumns.includes('session_date')) {
          dynamicColumns.push('session_date');
          dynamicValues.push('NOW()');
        }
        
        if (requiredColumns.includes('duration')) {
          dynamicColumns.push('duration');
          dynamicValues.push('60');
        }
        
        if (requiredColumns.includes('status')) {
          dynamicColumns.push('status');
          dynamicValues.push(`'active'`);
        }
        
        if (requiredColumns.includes('type')) {
          dynamicColumns.push('type');
          dynamicValues.push(`'one_on_one'`);
        }
        
        if (requiredColumns.includes('created_at')) {
          dynamicColumns.push('created_at');
          dynamicValues.push('NOW()');
        }
        
        if (requiredColumns.includes('updated_at')) {
          dynamicColumns.push('updated_at');
          dynamicValues.push('NOW()');
        }
        
        // Build the dynamic SQL
        const dynamicSql = `
          INSERT INTO public.counseling_sessions (
            ${dynamicColumns.join(',\n            ')}
          ) VALUES (
            ${dynamicValues.join(',\n            ')}
          )
          ON CONFLICT (id) DO UPDATE
          SET updated_at = NOW()
          RETURNING *;
        `;
        
        console.log('FIX COUNSELING SESSION: Dynamic SQL:', dynamicSql);
        
        const { data: dynamicSession, error: dynamicError } = await supabase.rpc('exec_sql', {
          sql: dynamicSql
        });
        
        if (dynamicError) {
          console.error('FIX COUNSELING SESSION: Error with dynamic SQL:', dynamicError);
          return NextResponse.json({
            success: false,
            error: 'Error creating session with dynamic SQL',
            details: dynamicError.message,
            sql: dynamicSql
          }, { status: 500 });
        }
        
        console.log('FIX COUNSELING SESSION: Session created with dynamic SQL:', dynamicSession);
        
        return NextResponse.json({
          success: true,
          message: 'Counseling session fixed successfully with dynamic SQL',
          session: dynamicSession,
          tableStructure
        });
      } catch (dynamicError) {
        console.error('FIX COUNSELING SESSION: Error with dynamic approach:', dynamicError);
        return NextResponse.json({
          success: false,
          error: 'Error with dynamic approach',
          details: dynamicError.message,
          originalError: createSessionError.message
        }, { status: 500 });
      }
    }
    
    console.log('FIX COUNSELING SESSION: Session created:', createdSession);
    
    return NextResponse.json({
      success: true,
      message: 'Counseling session fixed successfully',
      session: createdSession,
      tableStructure
    });
  } catch (error) {
    console.error('FIX COUNSELING SESSION: Unexpected error:', error);
    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred',
      details: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
