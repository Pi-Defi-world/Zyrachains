import { NextRequest } from 'next/server';

export interface UploadResult {
  success: boolean;
  url?: string;
  filename?: string;
  size?: number;
  type?: string;
  error?: string;
}

export interface UploadConfig {
  maxSize: number;
  allowedTypes: string[];
  storage: 'local' | 'cloudinary' | 'aws-s3' | 'vercel-blob';
  cloudinaryConfig?: {
    cloudName: string;
    apiKey: string;
    apiSecret: string;
  };
  awsConfig?: {
    accessKeyId: string;
    secretAccessKey: string;
    region: string;
    bucket: string;
  };
  vercelBlobToken?: string;
}

// Default configuration
const defaultConfig: UploadConfig = {
  maxSize: 5 * 1024 * 1024, // 5MB
  allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
  storage: 'local'
};

// Validate file
export function validateFile(file: File, config: UploadConfig = defaultConfig): { valid: boolean; error?: string } {
  if (!file) {
    return { valid: false, error: 'No file provided' };
  }

  if (file.size > config.maxSize) {
    return { valid: false, error: `File size must be less than ${config.maxSize / 1024 / 1024}MB` };
  }

  if (!config.allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Invalid file type. Only JPG, PNG, GIF, and WebP are allowed' };
  }

  return { valid: true };
}

// Generate unique filename
export function generateFilename(originalName: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  const extension = originalName.split('.').pop();
  return `${timestamp}-${random}.${extension}`;
}

// Local storage upload
export async function uploadToLocal(file: File, folder: string = 'blog', request?: Request): Promise<UploadResult> {
  try {
    const { writeFile, mkdir } = await import('fs/promises');
    const { join } = await import('path');
    const { existsSync } = await import('fs');

    const uploadDir = join(process.cwd(), 'public', 'uploads', folder);
    
    // Ensure upload directory exists
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    const filename = generateFilename(file.name);
    const filePath = join(uploadDir, filename);

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    await writeFile(filePath, buffer);

    // Generate URL - check if we need absolute URL for admin app
    let publicUrl = `/uploads/${folder}/${filename}`;
    
    // If request is provided and it's from admin app, return absolute URL
    if (request) {
      const origin = request.headers.get('origin') || request.headers.get('referer');
      if (origin && (origin.includes('localhost:5173') || origin.includes('admin'))) {
        // This is from admin app, return absolute URL
        const host = request.headers.get('host') || 'localhost:8000';
        const protocol = request.headers.get('x-forwarded-proto') || 'http';
        publicUrl = `${protocol}://${host}/uploads/${folder}/${filename}`;
      }
    }

    return {
      success: true,
      url: publicUrl,
      filename: filename,
      size: file.size,
      type: file.type
    };
  } catch (error) {
    console.error('Local upload error:', error);
    return {
      success: false,
      error: 'Failed to upload image to local storage'
    };
  }
}

// Cloudinary upload (requires cloudinary package)
export async function uploadToCloudinary(file: File, config: UploadConfig): Promise<UploadResult> {
  try {
    if (!config.cloudinaryConfig) {
      throw new Error('Cloudinary configuration is required');
    }

    // Note: This requires the cloudinary package to be installed
    // npm install cloudinary
    const { v2: cloudinary } = await import('cloudinary');
    
    cloudinary.config({
      cloud_name: config.cloudinaryConfig.cloudName,
      api_key: config.cloudinaryConfig.apiKey,
      api_secret: config.cloudinaryConfig.apiSecret,
    });

    // Convert file to base64
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString('base64');
    const dataURI = `data:${file.type};base64,${base64}`;

    // Upload to Cloudinary
    const result = await new Promise<any>((resolve, reject) => {
      cloudinary.uploader.upload(
        dataURI,
        {
          folder: 'blog',
          resource_type: 'image',
          transformation: [
            { width: 1200, height: 800, crop: 'limit' },
            { quality: 'auto' }
          ]
        },
        (error: any, result: any) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
    });

    return {
      success: true,
      url: result.secure_url,
      filename: result.public_id,
      size: file.size,
      type: file.type
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    return {
      success: false,
      error: 'Failed to upload image to Cloudinary'
    };
  }
}

// AWS S3 upload
export async function uploadToS3(file: File, config: UploadConfig): Promise<UploadResult> {
  try {
    if (!config.awsConfig) {
      throw new Error('AWS configuration is required');
    }

    const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');
    
    const s3Client = new S3Client({
      region: config.awsConfig.region,
      credentials: {
        accessKeyId: config.awsConfig.accessKeyId,
        secretAccessKey: config.awsConfig.secretAccessKey,
      },
    });

    const filename = generateFilename(file.name);
    const key = `blog/${filename}`;

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const command = new PutObjectCommand({
      Bucket: config.awsConfig.bucket,
      Key: key,
      Body: buffer,
      ContentType: file.type,
      ACL: 'public-read',
    });

    await s3Client.send(command);

    const url = `https://${config.awsConfig.bucket}.s3.${config.awsConfig.region}.amazonaws.com/${key}`;

    return {
      success: true,
      url: url,
      filename: filename,
      size: file.size,
      type: file.type
    };
  } catch (error) {
    console.error('S3 upload error:', error);
    return {
      success: false,
      error: 'Failed to upload image to S3'
    };
  }
}

// Vercel Blob upload (production default — the local filesystem is read-only on Vercel)
export async function uploadToVercelBlob(file: File, folder: string = 'blog'): Promise<UploadResult> {
  try {
    const { put } = await import('@vercel/blob');
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) {
      console.warn('[upload] attempted Vercel Blob upload but BLOB_READ_WRITE_TOKEN is NOT set in this runtime environment');
      throw new Error('BLOB_READ_WRITE_TOKEN is not set in this runtime environment');
    }
    // Masked token presence so function logs reveal the store without leaking it.
    console.log('[upload] using Vercel Blob, token present, store id:', token.split('_')[2] ?? 'unknown');

    const filename = generateFilename(file.name);
    const pathname = `uploads/${folder}/${filename}`;

    const result = await put(pathname, file, {
      access: 'public',
      token,
      contentType: file.type,
      addRandomSuffix: false,
    });

    return {
      success: true,
      url: result.url,
      filename: result.pathname,
      size: file.size,
      type: file.type,
    };
  } catch (error: any) {
    console.error('Vercel Blob upload error:', error?.message || error);
    return {
      success: false,
      error: `Vercel Blob upload failed: ${error?.message || 'unknown error'}`,
    };
  }
}

// Main upload function
export async function uploadImage(file: File, config: UploadConfig = defaultConfig, request?: Request): Promise<UploadResult> {
  // Validate file first
  const validation = validateFile(file, config);
  if (!validation.valid) {
    return {
      success: false,
      error: validation.error
    };
  }

  // Upload based on storage type
  switch (config.storage) {
    case 'local':
      return await uploadToLocal(file, 'blog', request);
    case 'cloudinary':
      return await uploadToCloudinary(file, config);
    case 'aws-s3':
      return await uploadToS3(file, config);
    case 'vercel-blob':
      return await uploadToVercelBlob(file, 'blog');
    default:
      return {
        success: false,
        error: 'Invalid storage type'
      };
  }
}

// Helper function to get upload configuration from environment
export function getUploadConfig(): UploadConfig {
  const configuredStorage = process.env.IMAGE_STORAGE as 'local' | 'cloudinary' | 'aws-s3' | 'vercel-blob' | undefined;
  const hasBlobToken = !!process.env.BLOB_READ_WRITE_TOKEN;

  // If no explicit storage is set but a Vercel Blob token exists (e.g. in Vercel
  // production), prefer Blob — the local filesystem is read-only on Vercel.
  const storage: UploadConfig['storage'] =
    configuredStorage || (hasBlobToken ? 'vercel-blob' : 'local');

  const config: UploadConfig = {
    maxSize: parseInt(process.env.MAX_FILE_SIZE || '5242880'), // 5MB default
    allowedTypes: (process.env.ALLOWED_IMAGE_TYPES || 'image/jpeg,image/jpg,image/png,image/gif,image/webp').split(','),
    storage: storage
  };

  if (storage === 'cloudinary') {
    config.cloudinaryConfig = {
      cloudName: process.env.CLOUDINARY_CLOUD_NAME!,
      apiKey: process.env.CLOUDINARY_API_KEY!,
      apiSecret: process.env.CLOUDINARY_API_SECRET!
    };
  }

  if (storage === 'aws-s3') {
    config.awsConfig = {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      region: process.env.AWS_REGION!,
      bucket: process.env.AWS_S3_BUCKET!
    };
  }

  if (storage === 'vercel-blob') {
    config.vercelBlobToken = process.env.BLOB_READ_WRITE_TOKEN;
  }

  return config;
} 