'use server';

import { NextResponse } from 'next/server';
import { supabase } from '@/utils/supabaseClient';
import crypto from 'crypto';

export async function POST() {
  try {
    // Generate a secure signature and expiration time
    const secureSignature = crypto.randomBytes(32).toString('hex');
    const secureExpire = Math.floor(Date.now() / 1000) + 3600; // 1 hour expiration
    
    return NextResponse.json({
      secureSignature,
      secureExpire
    });
  } catch (error) {
    console.error('Error generating presigned URL:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
