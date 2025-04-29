'use server';

import { NextResponse } from 'next/server';
import { supabase } from '@/utils/supabaseClient';

export async function POST(request) {
  try {
    // Check if the request is a FormData request
    const contentType = request.headers.get('content-type');
    
    if (contentType && contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file');
      
      if (!file) {
        return NextResponse.json({ error: 'No file provided' }, { status: 400 });
      }
      
      // Convert the file to a buffer
      const buffer = Buffer.from(await file.arrayBuffer());
      const fileName = `${Date.now()}_${file.name}`;
      
      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('uploads')
        .upload(fileName, buffer, {
          contentType: file.type,
          upsert: false
        });
      
      if (error) {
        console.error('Supabase storage upload error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      
      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('uploads')
        .getPublicUrl(fileName);
      
      return NextResponse.json({ 
        url: publicUrl,
        mimeType: file.type 
      });
    } 
    // Handle JSON request (URL or base64)
    else if (contentType && contentType.includes('application/json')) {
      const body = await request.json();
      
      if (body.url) {
        // Handle URL upload (e.g., fetch the file and upload to storage)
        return NextResponse.json({ 
          url: body.url, // For simplicity, just return the same URL
          mimeType: 'application/octet-stream' 
        });
      } 
      else if (body.base64) {
        // Handle base64 upload
        const base64Data = body.base64.split(',')[1] || body.base64;
        const buffer = Buffer.from(base64Data, 'base64');
        const fileName = `${Date.now()}_file.png`; // Default to PNG
        
        const { data, error } = await supabase.storage
          .from('uploads')
          .upload(fileName, buffer, {
            contentType: 'image/png',
            upsert: false
          });
        
        if (error) {
          console.error('Supabase storage upload error:', error);
          return NextResponse.json({ error: error.message }, { status: 500 });
        }
        
        const { data: { publicUrl } } = supabase.storage
          .from('uploads')
          .getPublicUrl(fileName);
        
        return NextResponse.json({ 
          url: publicUrl,
          mimeType: 'image/png' 
        });
      }
    }
    
    return NextResponse.json({ error: 'Invalid request format' }, { status: 400 });
  } catch (error) {
    console.error('Upload API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
