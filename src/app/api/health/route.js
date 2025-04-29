import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Check if Supabase environment variables are set
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      version: process.env.npm_package_version || '0.1.0',
      supabase: {
        url: supabaseUrl ? 'Set' : 'Not set',
        anonKey: supabaseAnonKey ? 'Set' : 'Not set',
        serviceRoleKey: supabaseServiceRoleKey ? 'Set' : 'Not set'
      }
    });
  } catch (error) {
    return NextResponse.json({
      error: 'Health check failed',
      message: error.message
    }, { status: 500 });
  }
}
