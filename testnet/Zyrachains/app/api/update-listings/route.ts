import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getBackendUrl } from '@/lib/get-backend-url';

// Validation schema for update requests
const updateListingSchema = z.object({
  searchCriteria: z.object({
    projectName: z.string().optional(),
    email: z.string().email().optional(),
  }).refine(data => data.projectName || data.email, {
    message: "Either project name or email must be provided"
  }),
  updatedInfo: z.object({
    projectName: z.string().max(100).optional(),
    tagline: z.string().max(200).optional(),
    description: z.string().max(2000).optional(),
    category: z.enum(['DeFi', 'Gaming', 'NFT/Metaverse', 'Social', 'Tools', 'Education', 'Entertainment', 'Productivity', 'Other']).optional(),
    piIntegration: z.enum(['payments', 'rewards', 'governance', 'staking', 'other']).optional(),
    status: z.enum(['draft', 'submitted', 'under_review', 'approved', 'rejected']).optional(),
    links: z.object({
      website: z.string().url().optional().or(z.literal('')),
      github: z.string().url().optional().or(z.literal('')),
      twitter: z.string().url().optional().or(z.literal('')),
      discord: z.string().url().optional().or(z.literal('')),
      telegram: z.string().url().optional().or(z.literal('')),
      documentation: z.string().url().optional().or(z.literal('')),
    }).optional(),
    piWalletAddress: z.string().regex(/^G[A-Z0-9]{55}$/, 'Invalid Pi wallet address format').optional().or(z.literal('')),
    contactInfo: z.object({
      email: z.string().email().optional(),
      name: z.string().max(100).optional(),
      role: z.string().max(100).optional(),
      additionalInfo: z.string().optional(),
    }).optional(),
  }),
  changeReason: z.string().min(1).max(1000),
  requestedBy: z.object({
    email: z.string().email(),
    name: z.string().min(1).max(100),
    role: z.string().min(1).max(100),
  }),
});

// Validation schema for search requests
const searchSchema = z.object({
  projectName: z.string().optional(),
  email: z.string().email().optional(),
}).refine(data => data.projectName || data.email, {
  message: "Either project name or email must be provided"
});

const SERVER_URL = getBackendUrl();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const params = new URLSearchParams();
    
    searchParams.forEach((value, key) => {
      params.append(key, value);
    });

    const response = await fetch(`${SERVER_URL}/api/listings/update?${params}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Server responded with ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching update listings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch update listings' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(`${SERVER_URL}/api/listings/update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(errorData, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error creating update listing:', error);
    return NextResponse.json(
      { error: 'Failed to create update listing' },
      { status: 500 }
    );
  }
} 
