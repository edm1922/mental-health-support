import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic'; // This ensures the route is always dynamic

export async function GET() {
  try {
    return NextResponse.json({ 
      status: 'ok',
      message: 'API is working',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Test API error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error.message || 'Unknown error') },
      { status: 500 }
    );
  }
}
