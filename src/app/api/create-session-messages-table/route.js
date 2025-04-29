import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Initialize Supabase client with cookies
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    console.log('Create session_messages table API called');
    
    // Check if the table exists
    const { data: tableExists, error: tableCheckError } = await supabase.rpc('exec_sql', { 
      sql: `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'session_messages'
      );
      `
    });
    
    if (tableCheckError) {
      console.error('Error checking if table exists:', tableCheckError);
      return NextResponse.json({
        success: false,
        error: 'Failed to check if table exists: ' + tableCheckError.message
      });
    }
    
    const exists = tableExists && tableExists.length > 0 && tableExists[0].exists;
    
    if (exists) {
      console.log('session_messages table already exists');
      
      // Enable RLS on the table
      const { error: rlsError } = await supabase.rpc('exec_sql', { 
        sql: `
        ALTER TABLE public.session_messages ENABLE ROW LEVEL SECURITY;
        `
      });
      
      if (rlsError) {
        console.error('Error enabling RLS:', rlsError);
        return NextResponse.json({
          success: false,
          error: 'Failed to enable RLS: ' + rlsError.message
        });
      }
      
      // Create RLS policies
      const { error: policiesError } = await supabase.rpc('exec_sql', { 
        sql: `
        -- Create policy to allow users to view their own messages
        DROP POLICY IF EXISTS "Users can view their own messages" ON public.session_messages;
        CREATE POLICY "Users can view their own messages"
        ON public.session_messages
        FOR SELECT
        USING (auth.role() = 'authenticated');

        -- Create policy to allow users to insert messages
        DROP POLICY IF EXISTS "Users can insert messages" ON public.session_messages;
        CREATE POLICY "Users can insert messages"
        ON public.session_messages
        FOR INSERT
        WITH CHECK (auth.role() = 'authenticated');

        -- Create policy to allow users to update their own messages
        DROP POLICY IF EXISTS "Users can update their own messages" ON public.session_messages;
        CREATE POLICY "Users can update their own messages"
        ON public.session_messages
        FOR UPDATE
        USING (auth.role() = 'authenticated');

        -- Create policy to allow users to delete their own messages
        DROP POLICY IF EXISTS "Users can delete their own messages" ON public.session_messages;
        CREATE POLICY "Users can delete their own messages"
        ON public.session_messages
        FOR DELETE
        USING (auth.role() = 'authenticated');
        `
      });
      
      if (policiesError) {
        console.error('Error creating policies:', policiesError);
        return NextResponse.json({
          success: false,
          error: 'Failed to create policies: ' + policiesError.message
        });
      }
      
      return NextResponse.json({
        success: true,
        message: 'session_messages table already exists and policies have been updated'
      });
    }
    
    // Create the table
    const { error: createError } = await supabase.rpc('exec_sql', { 
      sql: `
      CREATE TABLE public.session_messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        session_id UUID REFERENCES public.counseling_sessions(id),
        sender_id UUID,
        recipient_id UUID,
        message TEXT,
        is_read BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      );

      -- Enable RLS
      ALTER TABLE public.session_messages ENABLE ROW LEVEL SECURITY;

      -- Create policy to allow users to view their own messages
      DROP POLICY IF EXISTS "Users can view their own messages" ON public.session_messages;
      CREATE POLICY "Users can view their own messages"
      ON public.session_messages
      FOR SELECT
      USING (auth.role() = 'authenticated');

      -- Create policy to allow users to insert messages
      DROP POLICY IF EXISTS "Users can insert messages" ON public.session_messages;
      CREATE POLICY "Users can insert messages"
      ON public.session_messages
      FOR INSERT
      WITH CHECK (auth.role() = 'authenticated');

      -- Create policy to allow users to update their own messages
      DROP POLICY IF EXISTS "Users can update their own messages" ON public.session_messages;
      CREATE POLICY "Users can update their own messages"
      ON public.session_messages
      FOR UPDATE
      USING (auth.role() = 'authenticated');

      -- Create policy to allow users to delete their own messages
      DROP POLICY IF EXISTS "Users can delete their own messages" ON public.session_messages;
      CREATE POLICY "Users can delete their own messages"
      ON public.session_messages
      FOR DELETE
      USING (auth.role() = 'authenticated');
      `
    });
    
    if (createError) {
      console.error('Error creating table:', createError);
      return NextResponse.json({
        success: false,
        error: 'Failed to create table: ' + createError.message
      });
    }
    
    return NextResponse.json({
      success: true,
      message: 'session_messages table created successfully'
    });
  } catch (error) {
    console.error('Error in create session_messages table API:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
