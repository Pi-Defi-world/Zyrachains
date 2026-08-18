import { NextRequest, NextResponse } from 'next/server';
import { uploadImage, getUploadConfig } from '@/lib/image-upload';

export async function POST(request: NextRequest) {
  try {
    console.log('Image upload request received');
    
    const formData = await request.formData();
    const file = formData.get('image') as File;
    const type = formData.get('type') as string;

    console.log('File received:', {
      name: file?.name,
      size: file?.size,
      type: file?.type
    });

    if (!file) {
      console.error('No file provided in request');
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Get upload configuration
    const config = getUploadConfig();
    console.log('Upload config:', {
      storage: config.storage,
      hasBlobToken: !!(config.storage === 'vercel-blob' && config.vercelBlobToken),
      maxSize: config.maxSize,
      allowedTypes: config.allowedTypes
    });
    
    // Upload the image
    console.log('Starting image upload...'); 
    const result = await uploadImage(file, config, request);
    console.log('Upload result:', result);

    if (!result.success) {
      console.error('Upload failed:', result.error);
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    console.log('Upload successful:', {
      url: result.url,
      filename: result.filename,
      size: result.size
    });

    return NextResponse.json({
      success: true,
      url: result.url,
      filename: result.filename,
      size: result.size,
      type: result.type
    });

  } catch (error) {
    console.error('Image upload error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to upload image' },
      { status: 500 }
    );
  }
}

// Handle OPTIONS request for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
} 