import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Check if the GitHub token is available
    const token = process.env.GITHUB_TOKEN;
    
    return NextResponse.json({
      success: true,
      tokenAvailable: !!token,
      tokenLength: token ? token.length : 0,
      tokenFirstChars: token ? `${token.substring(0, 4)}...` : null
    });
  } catch (error) {
    console.error('Error checking token:', error);
    return NextResponse.json({
      success: false,
      error: 'An error occurred while checking the token',
      details: error.message
    }, { status: 500 });
  }
}
