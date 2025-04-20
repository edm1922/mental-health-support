import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing or invalid authorization header' }, { status: 401 });
    }

    // Initialize Supabase client
    const supabase = createRouteHandlerClient({ cookies });

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Authentication failed', details: userError?.message }, { status: 401 });
    }

    // Check if the user is an admin
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError) {
      return NextResponse.json({ error: 'Failed to fetch user profile', details: profileError.message }, { status: 500 });
    }

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Only admins can perform this action' }, { status: 403 });
    }

    // Check if the discussion_posts table exists
    const { data: tableExists, error: tableError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT EXISTS (
          SELECT FROM pg_tables
          WHERE schemaname = 'public'
          AND tablename = 'discussion_posts'
        ) as table_exists;
      `
    });

    if (tableError) {
      return NextResponse.json({ 
        error: 'Error checking if discussion_posts table exists', 
        details: tableError.message 
      }, { status: 500 });
    }

    if (!tableExists || !tableExists[0] || !tableExists[0].table_exists) {
      return NextResponse.json({ 
        exists: false,
        message: 'The discussion_posts table does not exist',
        columns: {}
      });
    }

    // Check which columns exist in the discussion_posts table
    const { data: columns, error: columnsError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'discussion_posts';
      `
    });

    if (columnsError) {
      return NextResponse.json({ 
        error: 'Error checking discussion_posts columns', 
        details: columnsError.message 
      }, { status: 500 });
    }

    // Create a map of required columns and whether they exist
    const columnNames = columns.map(col => col.column_name);
    const requiredColumns = {
      'id': columnNames.includes('id'),
      'user_id': columnNames.includes('user_id'),
      'title': columnNames.includes('title'),
      'content': columnNames.includes('content'),
      'created_at': columnNames.includes('created_at'),
      'updated_at': columnNames.includes('updated_at'),
      'is_flagged': columnNames.includes('is_flagged'),
      'report_count': columnNames.includes('report_count'),
      'is_approved': columnNames.includes('is_approved'),
      'is_pinned': columnNames.includes('is_pinned'),
      'is_removed': columnNames.includes('is_removed'),
      'removed_by': columnNames.includes('removed_by'),
      'removed_at': columnNames.includes('removed_at'),
      'removal_reason': columnNames.includes('removal_reason')
    };

    // Check if all required removal columns exist
    const removalColumnsExist = 
      requiredColumns['is_removed'] && 
      requiredColumns['removed_by'] && 
      requiredColumns['removed_at'] && 
      requiredColumns['removal_reason'];

    return NextResponse.json({
      exists: true,
      message: removalColumnsExist 
        ? 'The discussion_posts table has all required removal columns' 
        : 'The discussion_posts table is missing some removal columns',
      columns: requiredColumns,
      removalColumnsExist
    });
  } catch (error) {
    console.error('Error checking forum schema:', error);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}
