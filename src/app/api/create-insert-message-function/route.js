import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Initialize Supabase client with cookies
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    console.log('Create insert_message function API called');
    
    // Read the SQL file
    const sqlFilePath = path.join(process.cwd(), 'src', 'sql', 'create_insert_message_function.sql');
    const sql = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Execute the SQL
    const { error } = await supabase.rpc('exec_sql', { sql });
    
    if (error) {
      console.error('Error creating insert_message function:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to create insert_message function: ' + error.message
      });
    }
    
    return NextResponse.json({
      success: true,
      message: 'insert_message function created successfully'
    });
  } catch (error) {
    console.error('Error in create insert_message function API:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
